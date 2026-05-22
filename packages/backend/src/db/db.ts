import { batch } from "dry-utils-async";
import {
  Container,
  connectDB,
  loadMockDBData,
  subscribeCosmosDBLogging,
} from "dry-utils-cosmosdb";
import { config } from "../config.ts";
import {
  CompanyStage,
  JobFamily,
  Presence,
  UsState,
  WorkTimeBasis,
} from "../models/enums.ts";
import type {
  Company,
  CompanyKey,
  CompanyQuickRef,
  IgnoreJob,
  Job,
  JobKey,
  Location,
  Metadata,
  SalaryStat,
} from "../models/models.ts";
import { JOB_EXPIRY_SEC, MS_PER_DAY } from "../utils/constants.ts";
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

  async getQuickRefs(): Promise<CompanyQuickRef[]> {
    const refObjs = await this.query<{
      id: string;
      name: string;
      website?: string;
    }>("SELECT c.id, c.name, c.website FROM c");

    return refObjs.map(({ id, name, website }) => [id, name, website]);
  }

  async upsert(company: Company) {
    await this.upsertItem(company);
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

    await this.upsertItem(job);
  }

  async remove({ id, companyId }: JobKey) {
    return this.deleteItem(id, companyId);
  }

  async removeMany(jobIds: string[], companyId: string) {
    return await batch("DeleteJob", jobIds, (id) =>
      this.remove({ id, companyId }),
    );
  }

  async aggregateMetadata(): Promise<Metadata> {
    const weekMs = Date.now() - 7 * MS_PER_DAY;

    type SalaryRow = {
      jobFamily?: string;
      salaryRange?: { cadence?: string; min?: number; max?: number };
    };

    // WHERE pushdown; mock built-in handles nested-path parameterized conditions
    const salaryQuery = {
      query:
        "SELECT c.jobFamily, c.salaryRange FROM c WHERE (c.salaryRange.cadence = @cadence)",
      parameters: [{ name: "@cadence", value: "salary" }],
    };

    const [
      jobCount,
      recentJobCount,
      presenceRows,
      jobFamilyRows,
      workTimeRows,
      stageRows,
      locationRows,
      salaryRaw,
    ] = await Promise.all([
      this.getCount(),
      this.getCount(["postTS", ">=", weekMs]),
      this.getCountBy("presence"),
      this.getCountBy("jobFamily"),
      this.getCountBy("workTimeBasis"),
      this.getCountBy("companyStage"),
      this.getCountBy("primaryLocation.regionCode"),
      this.query<SalaryRow>(salaryQuery),
    ]);

    const presenceCounts = toCountRecord(presenceRows, Presence);
    const jobFamilyCounts = toCountRecord(jobFamilyRows, JobFamily);
    const workTimeCounts = toCountRecord(workTimeRows, WorkTimeBasis);
    const stageCounts = toCountRecord(stageRows, CompanyStage);

    const topLocationCounts = toCountRecord(
      locationRows.sort((a, b) => b.count - a.count).slice(0, 10),
      UsState,
    );

    const salaryStats = computeSalaryStats(salaryRaw);

    return {
      id: "job",
      jobCount,
      recentJobCount,
      presenceCounts,
      jobFamilyCounts,
      workTimeCounts,
      stageCounts,
      topLocationCounts,
      salaryStats,
    };
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
    await this.upsertItem({
      id: jobId,
      atsCompany: this.#asPKey(key),
      reason,
    });
  }

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

// #region Aggregation helpers (exported for unit testing)

function toCountRecord<T extends string>(
  rows: { name: unknown; count: number }[],
  schema: {
    safeParse: (
      val: unknown,
    ) => { success: true; data: T } | { success: false };
  },
): Partial<Record<T, number>> {
  const result: Partial<Record<T, number>> = {};
  rows.forEach(({ name, count }) => {
    const parsed = schema.safeParse(name);
    if (parsed.success) {
      result[parsed.data] = count;
    }
  });
  return result;
}

/**
 * Computes annual salary percentile stats from raw job rows.
 * Emits one overall bucket (jobFamily undefined) plus one bucket per job family.
 * Buckets with fewer than 10 data points are omitted.
 * @param rows - Raw job rows containing jobFamily and salaryRange fields.
 * @returns Salary stats buckets sorted by bucket type (overall first, then by family).
 */
export function computeSalaryStats(
  rows: {
    jobFamily?: string;
    salaryRange?: { cadence?: string; min?: number; max?: number };
  }[],
): SalaryStat[] {
  const MIN_SAMPLES = 10;
  const groups = new Map<string | undefined, number[]>();

  for (const { jobFamily, salaryRange: sr } of rows) {
    if (sr?.cadence !== "salary") continue;
    const salMin = sr.min ?? 0;
    const salMax = sr.max ?? 0;
    if (salMin <= 0 && salMax <= 0) continue;

    const midpoint =
      salMin > 0 && salMax > 0
        ? (salMin + salMax) / 2
        : salMin > 0
          ? salMin
          : salMax;

    const overall = groups.get(undefined) ?? [];
    overall.push(midpoint);
    groups.set(undefined, overall);

    if (jobFamily) {
      const family = groups.get(jobFamily) ?? [];
      family.push(midpoint);
      groups.set(jobFamily, family);
    }
  }

  const stats: SalaryStat[] = [];
  for (const [key, midpoints] of groups) {
    if (midpoints.length < MIN_SAMPLES) continue;
    const sorted = [...midpoints].sort((a, b) => a - b);

    let jobFamily: JobFamily | undefined;
    if (key !== undefined) {
      const parsed = JobFamily.safeParse(key);
      if (!parsed.success) continue;
      jobFamily = parsed.data;
    }

    stats.push({
      jobFamily,
      count: sorted.length,
      p25: calcPercentile(sorted, 25),
      median: calcPercentile(sorted, 50),
      p75: calcPercentile(sorted, 75),
    });
  }
  return stats;
}

/**
 * Interpolated percentile of a pre-sorted array.
 * @param sorted - Numbers sorted ascending.
 * @param p - Percentile in the range [0, 100].
 * @returns The interpolated value at the given percentile, rounded to the nearest integer.
 */
export function calcPercentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]!;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return Math.round(sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo));
}

// #endregion
