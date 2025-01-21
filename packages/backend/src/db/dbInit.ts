import {
  Container,
  ContainerRequest,
  CosmosClient,
  Database,
} from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";
import { logError } from "../utils/telemetry";

export type ContainerName = "company" | "job" | "metadata" | "locationCache";

const DB_NAME = "jobboard";

let containerMap: Record<ContainerName, Container>;

export function getContainer(name: ContainerName) {
  return containerMap[name];
}

export async function connectDB() {
  try {
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

    //createContainer(database, "company", "ats", ["/description", "/website"]);
    createContainer(database, "company", "ats");
    //createContainer(database, "job", "companyId", ["/applyUrl","/description"]);
    createContainer(database, "job", "companyId");
    createContainer(database, "metadata", "id", "all");
    createContainer(database, "locationCache", "pKey", "all");

    console.log("CosmosDB connected");
  } catch (error) {
    logError(error);
    process.exit(1);
  }
}

async function createContainer(
  database: Database,
  name: ContainerName,
  partitionKey: string,
  indexExclusions: "none" | "all" | string[] = "none",
  isRetry: boolean = false
) {
  try {
    const details: ContainerRequest = {
      id: name,
      partitionKey: {
        paths: [`/${partitionKey}`],
      },
    };

    if (indexExclusions === "all") {
      indexExclusions = ["/*"];
    }

    if (indexExclusions !== "none") {
      details.indexingPolicy = {
        excludedPaths: indexExclusions.map((path) => ({ path })),
      };
    }

    const { container } = await database.containers.createIfNotExists(details);

    containerMap[name] = container;
  } catch (error) {
    console.log(`Failed to create container: ${name}.`);
    logError(error);
    if (!isRetry) {
      console.log(`Retrying to create container: ${name}.`);
      createContainer(database, name, partitionKey, indexExclusions, true);
    } else {
      console.log(`Retry failed to create container: ${name}.`);
    }
  }
}
