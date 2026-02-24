import { db } from "../db/db.ts";
import type { ClientMetadata } from "../models/clientModels.ts";
import { debounceAsync, debouncePromise } from "../utils/debounceUtils.ts";
import { logProperty } from "../utils/telemetry.ts";

const cachedMetadata = debouncePromise(loadMetadata);
const cachedCompanyNames = debouncePromise(loadCompanyNames);

export function getMetadata(): Promise<ClientMetadata> {
  return cachedMetadata();
}

export async function getCompanyName(
  companyId: string,
): Promise<string | undefined> {
  const companyMap = await cachedCompanyNames();
  return companyMap.get(companyId);
}

export const refreshCompanyMetadata = debounceAsync(
  "RefreshMetadata",
  refreshCompanyInternal,
);

export const refreshJobMetadata = debounceAsync(
  "RefreshMetadata",
  refreshJobInternal,
);

async function refreshCompanyInternal() {
  const companies = await db.company.query<{ id: string; name: string }>(
    "SELECT c.id, c.name FROM c",
  );

  await db.metadata.upsertItem({
    id: "company",
    companyCount: companies.length,
    companyNames: companies.map((company) => [company.id, company.name]),
  });

  logProperty("Metadata", { companyCount: companies.length });

  cachedMetadata.clear();
  cachedCompanyNames.clear();
}

async function refreshJobInternal() {
  const jobCount = await db.job.getCount();

  await db.metadata.upsertItem({
    id: "job",
    jobCount,
  });

  logProperty("Metadata", { jobCount });

  cachedMetadata.clear();
}

async function loadMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, jobMetadata] = await Promise.all([
    db.metadata.getItem("company", "company"),
    db.metadata.getItem("job", "job"),
  ]);

  const companyNames = companyMetadata?.companyNames ?? [];

  const metadata: ClientMetadata = {
    companyCount: companyMetadata?.companyCount ?? 0,
    companyNames,
    jobCount: jobMetadata?.jobCount ?? 0,
    // _ts is in seconds, but the client expects milliseconds
    timestamp:
      Math.max(companyMetadata?._ts ?? 0, jobMetadata?._ts ?? 0) * 1000,
  };

  return metadata;
}

async function loadCompanyNames(): Promise<Map<string, string>> {
  const metadata = await cachedMetadata();
  return new Map(metadata.companyNames);
}
