import type { Container, ContainerRequest, Database } from "@azure/cosmos";
import { CosmosClient } from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config.ts";
import { logError } from "../utils/telemetry.ts";

export type ContainerName = "company" | "job" | "metadata" | "locationCache";

const DB_NAME = "jobboard";
const MAX_CREATE_ATTEMPTS = 3;

let containerMap: Record<ContainerName, Container>;

/**
 * Retrieves a Cosmos DB container by name
 * @param name - The name of the container to retrieve
 * @returns The requested Container instance
 */
export function getContainer(name: ContainerName) {
  return containerMap[name];
}

/**
 * Establishes connection to Cosmos DB and initializes containers
 * Creates database and containers if they don't exist
 * @throws {Error} If database connection fails
 * @returns Promise that resolves when all containers are initialized
 */
export async function connectDB(): Promise<void> {
  let agent;
  if (config.NODE_ENV === "dev") {
    agent = new https.Agent({
      ca: fs.readFileSync(config.DATABASE_LOCAL_CERT_PATH),
    });
  }

  const cosmosClient = new CosmosClient({
    endpoint: config.DATABASE_URL,
    key: config.DATABASE_KEY,
    agent,
  });

  const { database } = await cosmosClient.databases.createIfNotExists({
    id: DB_NAME,
  });

  containerMap = {} as Record<ContainerName, Container>;

  const containerPromises = [
    createContainer(database, "company", "ats", [
      "/description/?",
      "/website/?",
    ]),
    createContainer(database, "job", "companyId"),
    createContainer(database, "metadata", "id", "all"),
    createContainer(database, "locationCache", "pKey", "all"),
  ];

  const results = await Promise.allSettled(containerPromises);
  const hasFailure = results.some((r) => r.status === "rejected");

  if (hasFailure) {
    throw new Error(`Failed to initialize all containers`);
  }

  console.log("CosmosDB connected");
}

async function createContainer(
  database: Database,
  name: ContainerName,
  partitionKey: string,
  indexExclusions: "none" | "all" | string[] = "none",
  attempt = 1
): Promise<void> {
  try {
    const details: ContainerRequest = {
      id: name,
      partitionKey: {
        paths: [`/${partitionKey}`],
      },
    };

    if (indexExclusions !== "none") {
      details.indexingPolicy = getIndexingPolicy(indexExclusions);
    }

    const { container } = await database.containers.createIfNotExists(details);
    containerMap[name] = container;
  } catch (error) {
    console.log(`Failed to create container: ${name} (attempt ${attempt})`);
    logError(error);

    if (attempt < MAX_CREATE_ATTEMPTS) {
      return createContainer(
        database,
        name,
        partitionKey,
        indexExclusions,
        attempt + 1
      );
    }

    throw new Error(
      `Failed to create container ${name} after ${attempt} attempts`
    );
  }
}

function getIndexingPolicy(exclusions: "all" | string[]) {
  const all = [{ path: "/*" }];

  if (exclusions === "all") {
    return { excludedPaths: all };
  }

  return {
    includedPaths: all,
    excludedPaths: ['/"_etag"/?', ...exclusions].map((path) => ({ path })),
  };
}
