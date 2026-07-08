import {
  Container,
  connectDB,
  loadMockDBData,
  subscribeCosmosDBLogging,
} from "dry-utils-cosmosdb";
import { config } from "../config.ts";
import type {
  Company,
  ETag,
  IgnoreJob,
  Job,
  Location,
  Metadata,
} from "../models/models.ts";
import {
  createSubscribeAggregator,
  subscribeError,
  subscribeLog,
} from "../telemetry/telemetry.ts";
import { CompanyContainer } from "./CompanyContainer.ts";
import { ETagContainer } from "./ETagContainer.ts";
import { IgnoreJobContainer } from "./IgnoreJobContainer.ts";
import { JobContainer } from "./JobContainer.ts";
import { MetadataContainer } from "./MetadataContainer.ts";

subscribeCosmosDBLogging({
  log: subscribeLog,
  error: subscribeError,
  aggregate: createSubscribeAggregator("db", 10),
});

class DB {
  #company: CompanyContainer | undefined;
  #job: JobContainer | undefined;
  #ignoreJob: IgnoreJobContainer | undefined;
  #metadata: MetadataContainer | undefined;
  #locationCache: Container<Location> | undefined;
  #eTag: ETagContainer | undefined;

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

  get eTag() {
    return this.#validate(this.#eTag);
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
        CompanyContainer.ContainerOptions(),
        JobContainer.ContainerOptions(),
        IgnoreJobContainer.ContainerOptions(),
        MetadataContainer.ContainerOptions(),
        {
          name: "locationCache",
          partitionKey: "pKey",
          indexExclusions: "all",
        },
        ETagContainer.ContainerOptions(),
      ],
    });

    this.#company = new CompanyContainer(
      containers["company"] as Container<Company>,
    );
    this.#job = new JobContainer(containers["job"] as Container<Job>);
    this.#ignoreJob = new IgnoreJobContainer(
      containers["ignoreJob"] as Container<IgnoreJob>,
    );
    this.#metadata = new MetadataContainer(
      containers["metadata"] as Container<Metadata>,
    );
    this.#locationCache = containers["locationCache"];
    this.#eTag = new ETagContainer(containers["etag"] as Container<ETag>);
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
