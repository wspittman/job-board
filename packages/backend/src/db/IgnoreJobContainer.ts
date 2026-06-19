import { batch } from "dry-utils-async";
import { Container, type ContainerOptions } from "dry-utils-cosmosdb";
import type { CompanyKey, IgnoreJob } from "../models/models.ts";
import { JOB_EXPIRY_SEC } from "../utils/constants.ts";

const ContainerName = "ignoreJob";

/** Database operations for jobs excluded from ATS synchronization. */
export class IgnoreJobContainer extends Container<IgnoreJob> {
  /** Returns the Cosmos DB initialization options for this container. */
  static ContainerOptions(): ContainerOptions {
    return {
      name: ContainerName,
      partitionKey: "atsCompany",
      ttlSeconds: JOB_EXPIRY_SEC,
      indexExclusions: "all",
    };
  }

  /** Wraps an initialized ignored-job container. */
  constructor(container: Container<IgnoreJob>) {
    super(ContainerName, container.container);
  }

  /** Gets an ignored job for a company. */
  async get(jobId: string, key: CompanyKey) {
    return this.getItem(jobId, this.#asPKey(key));
  }

  /** Gets all ignored job IDs for a company. */
  async getIds(key: CompanyKey) {
    return this.getIdsByPartitionKey(this.#asPKey(key));
  }

  /** Creates or updates an ignored job. */
  async upsert(jobId: string, key: CompanyKey, reason: string) {
    await this.upsertItem({
      id: jobId,
      atsCompany: this.#asPKey(key),
      reason,
    });
  }

  /** Creates or updates several ignored jobs for a company. */
  async upsertMany(jobIds: string[], key: CompanyKey, reason: string) {
    const atsCompany = this.#asPKey(key);
    return await batch("UpsertIgnoreJob", jobIds, async (id) => {
      await this.upsertItem({ id, atsCompany, reason });
    });
  }

  #asPKey({ ats, id }: CompanyKey) {
    return `${ats}+${id}`;
  }
}
