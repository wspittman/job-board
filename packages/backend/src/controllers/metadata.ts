import { db } from "../db/db";
import { logProperty } from "../utils/telemetry";
import type { ClientMetadata } from "./clientModels";

let cachedMetadata: ClientMetadata | undefined;

export async function renewMetadata() {
  const companies = await db.company.query<{ id: string; name: string }>(
    "SELECT c.id, c.name FROM c"
  );

  const jobCount = await db.job.getCount();

  await db.metadata.upsert({
    id: "metadata",
    companyCount: companies.length,
    companyNames: companies.map((company) => [company.id, company.name]),
    jobCount,
  });

  logProperty("Metadata", { companyCount: companies.length, jobCount });

  cachedMetadata = undefined;
}

export async function getMetadata() {
  if (!cachedMetadata) {
    // TBD: This would benefit from a lock
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

  return cachedMetadata;
}
