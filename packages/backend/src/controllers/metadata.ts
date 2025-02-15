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
    // Legacy version during transition
    const metadata = await db.metadata.getItem("metadata", "metadata");

    cachedMetadata = {
      companyCount:
        companyMetadata?.companyCount ?? metadata?.companyCount ?? 0,
      companyNames:
        companyMetadata?.companyNames ?? metadata?.companyNames ?? [],
      jobCount: jobMetadata?.jobCount ?? metadata?.jobCount ?? 0,
      // _ts is in seconds, but the client expects milliseconds
      timestamp:
        Math.max(
          companyMetadata?._ts ?? 0,
          jobMetadata?._ts ?? 0,
          metadata?._ts ?? 0
        ) * 1000,
    };
  }

  return cachedMetadata;
}
