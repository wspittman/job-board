import { normalizedLocation } from "../utils/location.ts";
import { stripObj } from "../utils/objUtils.ts";
import type { ClientJob } from "./clientModels.ts";
import type { CompanyQuickRef, Job } from "./models.ts";

type GetCompanyQuickRef = (id: string) => Promise<CompanyQuickRef | undefined>;
let getCompanyQuickRef: GetCompanyQuickRef;

export function setGetCompanyQuickRef(fn: GetCompanyQuickRef) {
  getCompanyQuickRef = fn;
}

export async function toClientJobs(jobs: Job[]): Promise<ClientJob[]> {
  return Promise.all(jobs.map((job) => toClientJob(job)));
}

export async function toClientJob({
  id,
  companyId,
  title,
  description,
  postTS,
  presence,
  primaryLocation,
  salaryRange,
  requiredExperience,
  summary,
  workTimeBasis,
  jobFamily,
  companyStage,
}: Job): Promise<ClientJob> {
  const encodeId = encodeURIComponent(id);
  const encodeCompanyId = encodeURIComponent(companyId);
  const applyUrl = `/job/apply?id=${encodeId}&companyId=${encodeCompanyId}`;
  const [, companyName, website] = (await getCompanyQuickRef(companyId)) ?? [];

  return stripObj({
    // Keys
    id,
    companyId,

    // The Work
    title,
    company: companyName ?? companyId,
    workTimeBasis,
    jobFamily,
    companyStage,

    // The Compensation
    currency: salaryRange?.currency,
    minSalary: salaryRange?.min,
    payCadence: salaryRange?.cadence,

    // Other
    description,
    postTS,
    applyUrl,
    isRemote: presence === "remote",
    location: primaryLocation ? normalizedLocation(primaryLocation) : "",
    facets: {
      summary: summary ?? undefined,
      experience: requiredExperience ?? undefined,
    },

    companyWebsite: website,
  });
}
