import {
  Container,
  CosmosClient,
  Database,
  FeedOptions,
  ItemDefinition,
  SqlQuerySpec,
} from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";

type ContainerName = "company" | "job" | "metadata";

const DB_NAME = "jobboard";

interface Item {
  id: string;
  _rid: string;
  _self: string;
  _etag: string;
  _attachments: string;
  _ts: number;
}

let containerMap: Record<ContainerName, Container>;

export const getContainer = (name: ContainerName) => containerMap[name];

export async function getItem<T>(
  container: ContainerName,
  id: string,
  partitionKey: string
) {
  const { resource } = await getContainer(container)
    .item(id, partitionKey)
    .read();
  return stripItem<T>(resource);
}

export async function upsert(container: ContainerName, item: Object) {
  await getContainer(container).items.upsert(item);
}

export async function deleteItem(
  container: ContainerName,
  id: string,
  partitionKey: string
) {
  await getContainer(container).item(id, partitionKey).delete();
}

export async function getAllByPartitionKey<T extends ItemDefinition>(
  container: ContainerName,
  partitionKey: string
) {
  return getContainer(container).items.readAll<T>({ partitionKey }).fetchAll();
}

export async function getAllIdsByPartitionKey(
  container: ContainerName,
  partitionKey: string
) {
  const result = await query<{ id: string }>(container, "SELECT c.id FROM c", {
    partitionKey,
  });
  return result.map((entry) => entry.id);
}

export async function query<T>(
  container: ContainerName,
  query: string | SqlQuerySpec,
  options?: FeedOptions
) {
  const { resources } = await getContainer(container)
    .items.query(query, options)
    .fetchAll();
  return resources.map((entry) => stripItem<T>(entry));
}

function stripItem<T>(entry: Item): T {
  const { _rid, _self, _etag, _attachments, _ts, ...rest } = entry;
  return rest as T;
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

    createContainer(database, "company", "ats");
    createContainer(database, "job", "companyId");
    createContainer(database, "metadata", "id");

    console.log("CosmosDB connected");
  } catch (error) {
    console.error("CosmosDB connection error:", error);
    process.exit(1);
  }
}

async function createContainer(
  database: Database,
  name: ContainerName,
  partitionKey: string
) {
  const { container } = await database.containers.createIfNotExists({
    id: name,
    partitionKey: {
      paths: [`/${partitionKey}`],
    },
  });

  containerMap[name] = container;
}
