import { getContainer, getItem, upsert } from "../db/db";
import type { Metadata } from "../db/models";

let cachedMetadata: Metadata | undefined;

export async function renewMetadata() {
  const companies = (
    await getContainer("company")
      .items.query<{ id: string; name: string }>("SELECT c.id, c.name FROM c")
      .fetchAll()
  ).resources;

  const [jobCount] = (
    await getContainer("job")
      .items.query<number>("SELECT VALUE COUNT(1) FROM c")
      .fetchAll()
  ).resources;

  await upsert("metadata", {
    id: "metadata",
    companyCount: companies.length,
    companyNames: companies.map((company) => [company.id, company.name]),
    jobCount,
  });

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
