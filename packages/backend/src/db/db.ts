import { batch } from "dry-utils-async";
import {
  Container,
  connectDB,
  subscribeCosmosDBLogging,
} from "dry-utils-cosmosdb";
import { config } from "../config.ts";
import type {
  Company,
  CompanyKey,
  CompanyQuickRef,
  IgnoreJob,
  Job,
  JobKey,
  Location,
  Metadata,
} from "../models/models.ts";
import { JOB_EXPIRY_SEC } from "../utils/constants.ts";
import {
  createSubscribeAggregator,
  subscribeError,
  subscribeLog,
} from "../utils/telemetry.ts";
import { loadMockDBData } from "./mockDBOptions.ts";

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

  async getQuickRefs(): Promise<CompanyQuickRef[]> {
    const refObjs = await this.query<{
      id: string;
      name: string;
      website?: string;
    }>("SELECT c.id, c.name, c.website FROM c");

    return refObjs.map(({ id, name, website }) => [id, name, website]);
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

  async getCompanyIds(): Promise<string[]> {
    return await this.query<string>("SELECT DISTINCT VALUE c.companyId FROM c");
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

  async removeMany(jobIds: string[], companyId: string) {
    return await batch("DeleteJob", jobIds, (id) =>
      this.remove({ id, companyId }),
    );
  }
}

class IgnoreJobContainer extends Container<IgnoreJob> {
  constructor(container: Container<IgnoreJob>) {
    super("ignoreJob", container.container);
  }

  async get(jobId: string, key: CompanyKey) {
    return this.getItem(jobId, this.#asPKey(key));
  }

  async getIds(key: CompanyKey) {
    return this.getIdsByPartitionKey(this.#asPKey(key));
  }

  async upsert(jobId: string, key: CompanyKey, reason: string) {
    return this.upsertItem({
      id: jobId,
      atsCompany: this.#asPKey(key),
      reason,
    });
  }

  async upsertMany(jobIds: string[], key: CompanyKey, reason: string) {
    const atsCompany = this.#asPKey(key);
    return await batch("UpsertIgnoreJob", jobIds, (id) =>
      this.upsertItem({ id, atsCompany, reason }),
    );
  }

  #asPKey({ ats, id }: CompanyKey) {
    return `${ats}+${id}`;
  }
}

class DB {
  #company: CompanyContainer | undefined;
  #job: JobContainer | undefined;
  #ignoreJob: IgnoreJobContainer | undefined;
  #metadata: Container<Metadata> | undefined;
  #locationCache: Container<Location> | undefined;

  get company() {
    return this.#validate(this.#company);
  }

  get job() {
    return this.#validate(this.#job);
  }

  get ignoreJob() {
    return this.#validate(this.#ignoreJob);
  }

  get metadata() {
    return this.#validate(this.#metadata);
  }

  get locationCache() {
    return this.#validate(this.#locationCache);
  }

  /**
   * Establishes connection to Cosmos DB and initializes containers
   * Creates database and containers if they don't exist
   * @throws {Error} If database connection fails
   * @returns Promise that resolves when all containers are initialized
   */
  async connect(): Promise<void> {
    const containers = await connectDB({
      endpoint: config.DATABASE_URL,
      key: config.DATABASE_KEY,
      name: "jobboard",
      localCertPath:
        config.NODE_ENV === "dev" ? config.DATABASE_LOCAL_CERT_PATH : undefined,
      mockDBData: loadMockDBData({
        mockDataJson: config.DATABASE_MOCK_DATA_JSON,
        mockDataPath: config.DATABASE_MOCK_DATA_PATH,
      }),
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
          name: "ignoreJob",
          partitionKey: "atsCompany",
          ttlSeconds: JOB_EXPIRY_SEC,
          indexExclusions: "all",
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

    this.#company = new CompanyContainer(
      containers["company"] as Container<Company>,
    );
    this.#job = new JobContainer(containers["job"] as Container<Job>);
    this.#ignoreJob = new IgnoreJobContainer(
      containers["ignoreJob"] as Container<IgnoreJob>,
    );
    this.#metadata = containers["metadata"] as Container<Metadata>;
    this.#locationCache = containers["locationCache"];
  }

  #validate<T>(container: T | undefined): T {
    if (!container) {
      throw new Error(`DB not connected yet. Call connect() first.`);
    }
    return container;
  }
}

// Export the singleton instance
export const db = new DB();
