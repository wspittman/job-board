import { db } from "../db/db.ts";
import type { ClientMetadata } from "../models/clientModels.ts";

export async function getMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, companyNames, jobMetadata] = await Promise.all([
    db.metadata.getCompany(),
    db.metadata.getCompanyNames(),
    db.metadata.getJob(),
  ]);
  const { companyCount = 0, _ts: companyTS = 0 } = companyMetadata ?? {};
  const {
    jobCount = 0,
    recentJobCount = 0,
    presenceCounts = {},
    jobFamilyCounts = {},
    _ts: jobTS = 0,
  } = jobMetadata ?? {};

  const metadata: ClientMetadata = {
    // _ts is in seconds, but the client expects milliseconds
    timestamp: Math.max(companyTS, jobTS) * 1000,
    companyCount,
    companyNames,
    jobCount,
    recentJobCount,
    presenceCounts,
    jobFamilyCounts,
  };

  return metadata;
}
