import {
  FeedOptions,
  FeedResponse,
  ItemDefinition,
  ItemResponse,
  PartitionKey,
  Resource,
  SqlQuerySpec,
} from "@azure/cosmos";
import type {
  Company,
  CompanyKey,
  Job,
  JobKey,
  LocationCache,
  Metadata,
} from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { getSubContext, logError } from "../utils/telemetry";
import { ContainerName, getContainer } from "./dbInit";

/**
 * Generic container class for database operations
 * @template Item The type of items stored in the container
 */
class Container<Item extends ItemDefinition> {
  constructor(protected name: ContainerName) {}

  /**
   * Retrieves a single item from the container
   * @param id The unique identifier of the item
   * @param partitionKey The partition key for the item
   * @returns The requested item or undefined if not found
   */
  async getItem(id: string, partitionKey: string) {
    try {
      const response = await getContainer(this.name)
        .item(id, partitionKey)
        .read<Item>();
      logDBAction("READ", this.name, response, partitionKey);
      return response.resource;
    } catch (error) {
      throw new AppError("Error Fetching from Database", 500, error);
    }
  }

  /**
   * Retrieves all items from a partition
   * @param partitionKey The partition key to query
   * @returns Array of items in the partition
   */
  async getItemsByPartitionKey(partitionKey: string) {
    try {
      const response = await getContainer(this.name)
        .items.readAll<Item & Resource>({ partitionKey })
        .fetchAll();
      logDBAction("READ_ALL", this.name, response, partitionKey);
      return response.resources;
    } catch (error) {
      throw new AppError("Error Fetching from Database", 500, error);
    }
  }

  /**
   * Retrieves all item IDs from a partition
   * @param partitionKey The partition key to query
   * @returns Array of item IDs in the partition
   */
  async getIdsByPartitionKey(partitionKey: string) {
    const result = await this.query<{ id: string }>("SELECT c.id FROM c", {
      partitionKey,
    });
    return result.map((entry) => entry.id);
  }

  /**
   * Gets the total count of items in the container
   * @returns The total number of items
   */
  async getCount() {
    const response = await this.query<number>("SELECT VALUE COUNT(1) FROM c");
    return response[0];
  }

  /**
   * Executes a query against the container
   * @param query SQL query string or query spec
   * @param options Optional feed options including partition key
   * @returns Query results
   */
  async query<T>(query: string | SqlQuerySpec, options?: FeedOptions) {
    try {
      const response = await getContainer(this.name)
        .items.query<T>(query, options)
        .fetchAll();
      logDBAction("QUERY", this.name, response, options?.partitionKey, query);
      return response.resources;
    } catch (error) {
      throw new AppError("Error Querying from Database", 500, error);
    }
  }

  /**
   * Creates or updates an item in the container
   * @param item The item to upsert
   */
  async upsertItem(item: Item) {
    try {
      const response = await getContainer(this.name).items.upsert(item);
      logDBAction("UPSERT", this.name, response);
    } catch (error) {
      throw new AppError("Error Inserting to Database", 500, error);
    }
  }

  /**
   * Deletes an item from the container
   * @param id The unique identifier of the item
   * @param partitionKey The partition key for the item
   */
  async deleteItem(id: string, partitionKey: string) {
    try {
      const response = await getContainer(this.name)
        .item(id, partitionKey)
        .delete();
      logDBAction("DELETE", this.name, response, partitionKey);
    } catch (error) {
      throw new AppError("Error Deleting from Database", 500, error);
    }
  }
}

class CompanyContainer extends Container<Company> {
  constructor() {
    super("company");
  }

  async get({ id, ats }: CompanyKey) {
    return this.getItem(id, ats);
  }

  async getIds(ats: string) {
    return this.getIdsByPartitionKey(ats);
  }

  async getAll(ats: string) {
    return this.getItemsByPartitionKey(ats);
  }

  async getKeys() {
    return this.query<CompanyKey>(`SELECT c.id, c.ats FROM c`);
  }

  async upsert(company: Company) {
    return this.upsertItem(company);
  }

  async remove({ id, ats }: CompanyKey) {
    return this.deleteItem(id, ats);
  }
}

class JobContainer extends Container<Job> {
  constructor() {
    super("job");
  }

  async get({ id, companyId }: JobKey) {
    return this.getItem(id, companyId);
  }

  async getIds(companyId: string) {
    return this.getIdsByPartitionKey(companyId);
  }

  async getIdsAndTimestamps(companyId: string) {
    return this.query<{ id: string; _ts: number }>(
      "SELECT c.id, c._ts FROM c",
      { partitionKey: companyId }
    );
  }

  async upsert(job: Job) {
    return this.upsertItem(job);
  }

  async remove({ id, companyId }: JobKey) {
    return this.deleteItem(id, companyId);
  }
}

class DB {
  readonly job = new JobContainer();
  readonly company = new CompanyContainer();
  readonly metadata = new Container<Metadata>("metadata");
  readonly locationCache = new Container<LocationCache>("locationCache");

  constructor() {}
}

// Export the singleton instance
export const db = new DB();

// #region Telemetry

type DBAction = "READ" | "READ_ALL" | "UPSERT" | "DELETE" | "QUERY";

interface DBLog {
  name: DBAction;
  in: ContainerName;
  pkey?: PartitionKey;
  query?: string;
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
  pkey?: PartitionKey,
  query?: string | SqlQuerySpec
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

    if (query) {
      log.query = typeof query === "string" ? query : query.query;
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
