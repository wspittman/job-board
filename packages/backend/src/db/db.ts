import {
  Container,
  CosmosClient,
  Database,
  FeedOptions,
  FeedResponse,
  ItemDefinition,
  ItemResponse,
  PartitionKey,
  SqlQuerySpec,
} from "@azure/cosmos";
import fs from "fs";
import https from "https";
import { config } from "../config";
import { getRequestContext, logError } from "../utils/telemetry";

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
  const response = await getContainer(container).item(id, partitionKey).read();
  logDBAction("GET", container, response, partitionKey);
  return stripItem<T>(response.resource);
}

export async function upsert(container: ContainerName, item: Object) {
  const response = await getContainer(container).items.upsert(item);
  logDBAction("UPSERT", container, response);
}

export async function deleteItem(
  container: ContainerName,
  id: string,
  partitionKey: string
) {
  const response = await getContainer(container)
    .item(id, partitionKey)
    .delete();
  logDBAction("DELETE", container, response, partitionKey);
}

export async function getAllByPartitionKey<T extends ItemDefinition>(
  container: ContainerName,
  partitionKey: string
) {
  const response = await getContainer(container)
    .items.readAll<T>({ partitionKey })
    .fetchAll();
  logDBAction("GET_ALL", container, response, partitionKey);
  return response;
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
  const response = await getContainer(container)
    .items.query(query, options)
    .fetchAll();
  logDBAction("QUERY", container, response, options?.partitionKey);
  return response.resources.map((entry) => stripItem<T>(entry));
}

function stripItem<T>(entry: Item): T {
  const { _rid, _self, _etag, _attachments, ...rest } = entry;
  return rest as T;
}

// #region Telemetry

type DBAction = "GET" | "UPSERT" | "DELETE" | "GET_ALL" | "QUERY";

interface DBLog {
  name: DBAction;
  in: ContainerName;
  pkey?: PartitionKey;
  ru: number;
  ms: number;
  bytes: number;
  count?: number;
}

interface DBContext {
  calls: DBLog[];
  count: number;
  ru: number;
  ms: number;
  bytes: number;
}

function logDBAction(
  action: DBAction,
  container: ContainerName,
  response: ItemResponse<ItemDefinition> | FeedResponse<unknown>,
  pkey?: PartitionKey
) {
  const log: DBLog = {
    name: action,
    in: container,
    ru: response.requestCharge,
    ms: response.diagnostics.clientSideRequestStatistics.requestDurationInMs,
    bytes:
      response.diagnostics.clientSideRequestStatistics
        .totalResponsePayloadLengthInBytes,
  };

  if (pkey) {
    log.pkey = pkey;
  }

  if (response instanceof FeedResponse) {
    log.count = response.resources.length;
  }

  addDBLog(log);
}

function addDBLog(log: DBLog) {
  const context = getDBContext();

  if (context.calls.length < 10) {
    context.calls.push(log);
  }

  context.count++;
  context.ru += log.ru;
  context.ms += log.ms;
  context.bytes += log.bytes;
}

function getDBContext(): DBContext {
  const context = getRequestContext();
  context.db ??= <DBContext>{
    calls: [],
    count: 0,
    ru: 0,
    ms: 0,
    bytes: 0,
  };
  return <DBContext>context.db;
}

// #endregion

// #region Initialization

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
    logError(error);
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

// #endregion
