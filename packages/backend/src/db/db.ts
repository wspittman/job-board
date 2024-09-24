import {
  Container,
  CosmosClient,
  Database,
  JSONValue,
  SqlQuerySpec,
} from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";

type ContainerName = "company" | "job";

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

export async function upsert(container: ContainerName, item: Object) {
  await getContainer(container).items.upsert(item);
}

export async function deleteItem(container: ContainerName, id: string) {
  await getContainer(container).item(id).delete();
}

export async function queryFilters<T>(
  container: ContainerName,
  filters: Partial<T>
) {
  const entries: [string, JSONValue][] = Object.entries(filters);

  const whereClause = entries
    .map(([key]) => `c.${key} = @${key}`)
    .join(" AND ");

  const parameters = entries.map(([key, value]) => ({
    name: `@${key}`,
    value,
  }));

  return query<T>(container, {
    query: `SELECT * FROM c WHERE ${whereClause}`,
    parameters,
  });
}

export async function query<T>(
  container: ContainerName,
  query: string | SqlQuerySpec
) {
  const { resources } = await getContainer(container)
    .items.query(query)
    .fetchAll();
  return resources.map((entry) => stripItem<T>(entry));
}

function stripItem<T>(entry: Item): T & { id: string } {
  const { _rid, _self, _etag, _attachments, _ts, ...rest } = entry;
  return rest as T & { id: string };
}

export async function connectDB() {
  try {
    const agent = new https.Agent({
      ca: fs.readFileSync(config.DATABASE_LOCAL_CERT_PATH),
    });

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
    createContainer(database, "job", "company");

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
