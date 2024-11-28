import { getItem, query, upsert } from "../db/db";
import type { Metadata } from "../db/models";
import { logProperty } from "../utils/telemetry";

let cachedMetadata: Metadata | undefined;

export async function renewMetadata() {
  const companies = await query<{ id: string; name: string }>(
    "company",
    "SELECT c.id, c.name FROM c"
  );

  const [jobCount] = await query<number>("job", "SELECT VALUE COUNT(1) FROM c");

  await upsert("metadata", {
    id: "metadata",
    companyCount: companies.length,
    companyNames: companies.map((company) => [company.id, company.name]),
    jobCount,
  });

  logProperty("MetadataUpdate", { companyCount: companies.length, jobCount });

  cachedMetadata = undefined;
}

export async function getMetadata() {
  if (!cachedMetadata) {
    // TBD: This would benefit from a lock
    cachedMetadata = await getItem<Metadata>(
      "metadata",
      "metadata",
      "metadata"
    );
  }

  return cachedMetadata!;
}
