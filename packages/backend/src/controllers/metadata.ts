import { db } from "../db/db";
import type { ClientMetadata } from "../types/clientModels";
import { AsyncExecutor } from "../utils/asyncExecutor";
import { logProperty } from "../utils/telemetry";

let cachedMetadata: ClientMetadata | undefined;

export const metadataCompanyExecutor = new AsyncExecutor(
  "RefreshMetadata",
  refreshCompanyMetadata
);

export const metadataJobExecutor = new AsyncExecutor(
  "RefreshMetadata",
  refreshJobMetadata
);

async function refreshCompanyMetadata() {
  const companies = await db.company.query<{ id: string; name: string }>(
    "SELECT c.id, c.name FROM c"
  );

  await db.metadata.upsertItem({
    id: "company",
    companyCount: companies.length,
    companyNames: companies.map((company) => [company.id, company.name]),
  });

  logProperty("Metadata", { companyCount: companies.length });

  cachedMetadata = undefined;
}

async function refreshJobMetadata() {
  const jobCount = await db.job.getCount();

  await db.metadata.upsertItem({
    id: "job",
    jobCount,
  });

  logProperty("Metadata", { jobCount });

  cachedMetadata = undefined;
}

export async function getMetadata() {
  if (!cachedMetadata) {
    // TBD: This would benefit from a lock
    const companyMetadata = await db.metadata.getItem("company", "company");
    const jobMetadata = await db.metadata.getItem("job", "job");

    if (companyMetadata && jobMetadata) {
      const { companyCount, companyNames, _ts: companyTS } = companyMetadata;
      const { jobCount, _ts: jobTS } = jobMetadata;
      cachedMetadata = {
        companyCount,
        companyNames,
        jobCount,
        // _ts is in seconds, but the client expects milliseconds
        timestamp: Math.max(companyTS, jobTS) * 1000,
      };
    } else {
      // Legacy version during transition
      const metadata = await db.metadata.getItem("metadata", "metadata");
      if (metadata) {
        const { companyCount, companyNames, jobCount, _ts } = metadata;
        cachedMetadata = {
          companyCount,
          companyNames,
          jobCount,
          // _ts is in seconds, but the client expects milliseconds
          timestamp: _ts * 1000,
        };
      }
    }
  }

  return cachedMetadata;
}
