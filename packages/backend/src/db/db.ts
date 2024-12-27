import {
  FeedOptions,
  FeedResponse,
  ItemDefinition,
  ItemResponse,
  PartitionKey,
  Resource,
  SqlQuerySpec,
} from "@azure/cosmos";
import { getSubContext, logError } from "../utils/telemetry";
import { ContainerName, getContainer } from "./dbInit";
import { Company, Job, Metadata } from "./models";

class Container<Item extends ItemDefinition> {
  constructor(protected name: ContainerName) {}

  async getItem(id: string, partitionKey: string) {
    const response = await getContainer(this.name)
      .item(id, partitionKey)
      .read<Item>();
    logDBAction("READ", this.name, response, partitionKey);
    return response.resource;
  }

  async getAllByPartitionKey(partitionKey: string) {
    const response = await getContainer(this.name)
      .items.readAll<Item & Resource>({ partitionKey })
      .fetchAll();
    logDBAction("READ_ALL", this.name, response, partitionKey);
    return response.resources;
  }

  async getAllIdsByPartitionKey(partitionKey: string) {
    const result = await this.query<{ id: string }>("SELECT c.id FROM c", {
      partitionKey,
    });
    return result.map((entry) => entry.id);
  }

  async getCount() {
    const response = await this.query<number>("SELECT VALUE COUNT(1) FROM c");
    return response[0];
  }

  async query<T>(query: string | SqlQuerySpec, options?: FeedOptions) {
    const response = await getContainer(this.name)
      .items.query<T>(query, options)
      .fetchAll();
    logDBAction("QUERY", this.name, response, options?.partitionKey);
    return response.resources;
  }

  async upsert(item: Item) {
    const response = await getContainer(this.name).items.upsert(item);
    logDBAction("UPSERT", this.name, response);
  }

  async deleteItem(id: string, partitionKey: string) {
    const response = await getContainer(this.name)
      .item(id, partitionKey)
      .delete();
    logDBAction("DELETE", this.name, response, partitionKey);
  }
}

class DB {
  private static instance: DB;
  readonly job: Container<Job>;
  readonly company: Container<Company>;
  readonly metadata: Container<Metadata>;

  private constructor() {
    this.job = new Container("job");
    this.company = new Container("company");
    this.metadata = new Container("metadata");
  }

  static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }
}

// Export the singleton instance
export const db = DB.getInstance();

// #region Telemetry

type DBAction = "READ" | "READ_ALL" | "UPSERT" | "DELETE" | "QUERY";

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
