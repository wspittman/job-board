import { db } from "../db/db.ts";
import type { ClientMetadata } from "../models/clientModels.ts";
import { debounceAsync } from "../utils/debounceUtils.ts";
import { logProperty } from "../utils/telemetry.ts";

let cachedMetadata: Promise<ClientMetadata> | undefined;
let cachedCompanyNames: Map<string, string> | undefined;

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

  cachedMetadata = undefined;
  cachedCompanyNames = undefined;
}

async function refreshJobInternal() {
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
    cachedMetadata = loadMetadata().catch((error) => {
      cachedMetadata = undefined;
      throw error;
    });
  }

  return cachedMetadata;
}

export function getCompanyName(companyId: string): string | undefined {
  return cachedCompanyNames?.get(companyId);
}

async function loadMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, jobMetadata] = await Promise.all([
    db.metadata.getItem("company", "company"),
    db.metadata.getItem("job", "job"),
  ]);

  const companyNames = companyMetadata?.companyNames ?? [];
  cachedCompanyNames = new Map(companyNames);

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
