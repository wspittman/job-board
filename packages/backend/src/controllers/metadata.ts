import { db } from "../db/db";
import type { Metadata } from "../db/models";
import { logProperty } from "../utils/telemetry";

let cachedMetadata: Metadata | undefined;

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
    cachedMetadata = await db.metadata.getItem("metadata", "metadata");
  }

  return cachedMetadata!;
}
