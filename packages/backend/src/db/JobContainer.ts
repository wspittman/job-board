import { batch } from "dry-utils-async";
import { Container, Query, type ContainerOptions } from "dry-utils-cosmosdb";
import { JobFamily, Presence } from "../models/enums.ts";
import type { Job, JobKey, Metadata } from "../models/models.ts";
import { MS_PER_DAY } from "../utils/constants.ts";

const ContainerName = "job";

/** Database operations for jobs. */
export class JobContainer extends Container<Job> {
  /** Returns the Cosmos DB initialization options for this container. */
  static ContainerOptions(): ContainerOptions {
    return {
      name: ContainerName,
      partitionKey: "companyId",
    };
  }

  /** Wraps an initialized job container. */
  constructor(container: Container<Job>) {
    super(ContainerName, container.container);
  }

  /** Gets a job by its key. */
  async get({ id, companyId }: JobKey) {
    return this.getItem(id, companyId);
  }

  /** Gets all job IDs for a company. */
  async getIds(companyId: string) {
    return this.getIdsByPartitionKey(companyId);
  }

  /** Gets all jobs for a company. */
  async getAll(companyId: string) {
    return this.getItemsByPartitionKey(companyId);
  }

  /** Gets job IDs and Cosmos timestamps for a company. */
  async getIdsAndTimestamps(companyId: string) {
    return this.query<{ id: string; _ts: number }>(
      "SELECT c.id, c._ts FROM c",
      { partitionKey: companyId },
    );
  }

  /** Gets job IDs for a company with a post timestamp older than the cutoff. */
  async getExpiredIds(companyId: string, cutoffMS: number) {
    const result = await this.query<{ id: string }>(
      new Query("ID", ["postTS", "<", cutoffMS]),
      { partitionKey: companyId },
    );

    return result.map(({ id }) => id);
  }

  /** Gets IDs of companies that have jobs. */
  async getCompanyIds(): Promise<string[]> {
    return await this.query<string>("SELECT DISTINCT VALUE c.companyId FROM c");
  }

  /** Creates or updates a job. */
  async upsert(job: Job) {
    await this.upsertItem(job);
  }

  /** Removes a job. */
  async remove({ id, companyId }: JobKey) {
    return this.deleteItem(id, companyId);
  }

  /** Removes several jobs for a company. */
  async removeMany(jobIds: string[], companyId: string) {
    return await batch("DeleteJob", jobIds, (id) =>
      this.remove({ id, companyId }),
    );
  }

  /** Removes all jobs for a company. */
  async removeAll(companyId: string) {
    const ids = await this.getIds(companyId);
    if (!ids.length) return [];

    return await batch("RemoveAllJobs", ids, (id) =>
      this.deleteItem(id, companyId),
    );
  }

  /** Aggregates job metadata used by search filters and site statistics. */
  async aggregateMetadata(): Promise<Metadata> {
    const weekMs = Date.now() - 7 * MS_PER_DAY;

    const [jobCount, recentJobCount, presenceRows, jobFamilyRows] =
      await Promise.all([
        this.getCount(),
        this.getCount(["postTS", ">=", weekMs]),
        this.getCountBy("presence"),
        this.getCountBy("jobFamily"),
      ]);

    const presenceCounts: Partial<Record<Presence, number>> = {};
    presenceRows.forEach(({ name, count }) => {
      const parsed = Presence.safeParse(name);
      if (parsed.success) {
        presenceCounts[parsed.data] = count;
      }
    });

    const jobFamilyCounts: Partial<Record<JobFamily, number>> = {};
    jobFamilyRows.forEach(({ name, count }) => {
      const parsed = JobFamily.safeParse(name);
      if (parsed.success) {
        jobFamilyCounts[parsed.data] = count;
      }
    });

    return {
      id: "job",
      jobCount,
      recentJobCount,
      presenceCounts,
      jobFamilyCounts,
    };
  }
}
