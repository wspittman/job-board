import {
  FeedOptions,
  FeedResponse,
  ItemDefinition,
  ItemResponse,
  PartitionKey,
  SqlQuerySpec,
} from "@azure/cosmos";
import { getSubContext, logError } from "../utils/telemetry";
import { ContainerName, getContainer } from "./dbInit";

interface Item {
  id: string;
  _rid: string;
  _self: string;
  _etag: string;
  _attachments: string;
  _ts: number;
}

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

export async function getContainerCount(container: ContainerName) {
  const response = await query<number>(
    container,
    "SELECT VALUE COUNT(1) FROM c"
  );
  return response[0];
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
  return response.resources.map((entry) =>
    typeof entry === "object" ? stripItem<T>(entry) : entry
  );
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

const initialContext = () => ({
  calls: [] as DBLog[],
  count: 0,
  ru: 0,
  ms: 0,
  bytes: 0,
});

function logDBAction(
  action: DBAction,
  container: ContainerName,
  response: ItemResponse<ItemDefinition> | FeedResponse<unknown>,
  pkey?: PartitionKey
) {
  try {
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
  } catch (error) {
    logError(error);
  }
}

function addDBLog(log: DBLog) {
  const context = getSubContext("db", initialContext);

  if (context.calls.length < 10) {
    context.calls.push(log);
  }

  context.count++;
  context.ru += log.ru;
  context.ms += log.ms;
  context.bytes += log.bytes;
}

// #endregion
