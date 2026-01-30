import {
  Container,
  dbConnect,
  subscribeCosmosDBLogging,
} from "dry-utils-cosmosdb";
import { config } from "../config.ts";
import type {
  Company,
  CompanyKey,
  Job,
  JobKey,
  Location,
  Metadata,
} from "../models/models.ts";
import {
  createSubscribeAggregator,
  subscribeError,
  subscribeLog,
} from "../utils/telemetry.ts";

subscribeCosmosDBLogging({
  log: subscribeLog,
  error: subscribeError,
  aggregate: createSubscribeAggregator("db", 10),
});

class CompanyContainer extends Container<Company> {
  constructor(container: Container<Company>) {
    super("company", container.container);
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
  constructor(container: Container<Job>) {
    super("job", container.container);
  }

  async get({ id, companyId }: JobKey) {
    return this.getItem(id, companyId);
  }

  async getIds(companyId: string) {
    return this.getIdsByPartitionKey(companyId);
  }

  async getAll(companyId: string) {
    return this.getItemsByPartitionKey(companyId);
  }

  async getIdsAndTimestamps(companyId: string) {
    return this.query<{ id: string; _ts: number }>(
      "SELECT c.id, c._ts FROM c",
      { partitionKey: companyId },
    );
  }

  async upsert(job: Job) {
    job.locationSearchKey = [
      "",
      job.primaryLocation?.city ?? "",
      job.primaryLocation?.regionCode ?? "",
      job.primaryLocation?.countryCode ?? "",
      "",
    ].join("|");

    return this.upsertItem(job);
  }

  async remove({ id, companyId }: JobKey) {
    return this.deleteItem(id, companyId);
  }
}

class DB {
  private _company: CompanyContainer | undefined;
  private _job: JobContainer | undefined;
  private _metadata: Container<Metadata> | undefined;
  private _locationCache: Container<Location> | undefined;

  get company() {
    if (!this._company) {
      throw new Error("DB not connected yet. Call connect() first.");
    }
    return this._company;
  }

  get job() {
    if (!this._job) {
      throw new Error("DB not connected yet. Call connect() first.");
    }
    return this._job;
  }

  get metadata() {
    if (!this._metadata) {
      throw new Error("DB not connected yet. Call connect() first.");
    }
    return this._metadata;
  }

  get locationCache() {
    if (!this._locationCache) {
      throw new Error("DB not connected yet. Call connect() first.");
    }
    return this._locationCache;
  }

  /**
   * Establishes connection to Cosmos DB and initializes containers
   * Creates database and containers if they don't exist
   * @throws {Error} If database connection fails
   * @returns Promise that resolves when all containers are initialized
   */
  async connect(): Promise<void> {
    const containers = await dbConnect({
      endpoint: config.DATABASE_URL,
      key: config.DATABASE_KEY,
      name: "jobboard",
      localCertPath:
        config.NODE_ENV === "dev" ? config.DATABASE_LOCAL_CERT_PATH : undefined,
      containers: [
        {
          name: "company",
          partitionKey: "ats",
          indexExclusions: ["/description/?", "/website/?"],
        },
        {
          name: "job",
          partitionKey: "companyId",
        },
        {
          name: "metadata",
          partitionKey: "id",
          indexExclusions: "all",
        },
        {
          name: "locationCache",
          partitionKey: "pKey",
          indexExclusions: "all",
        },
      ],
    });

    this._company = new CompanyContainer(
      containers["company"] as Container<Company>,
    );
    this._job = new JobContainer(containers["job"] as Container<Job>);
    this._metadata = containers["metadata"] as Container<Metadata>;
    this._locationCache = containers["locationCache"] as Container<Location>;
  }
}

// Export the singleton instance
export const db = new DB();
