import { ATS, getAtsJobs } from "./ats/ats";
import { getCompanies } from "./db/company";
import { addJob, deleteJob, getJobIds } from "./db/job";

// TODO: This might take longer than the request timeout
export async function crawl() {
  return logWrap("Crawl", async () => {
    await Promise.all(Object.values(ATS).map(crawlAts));
  });
}

async function crawlAts(ats: ATS) {
  return logWrap(`CrawlAts(${ats})`, async () => {
    const companies = await getCompanies(ats);
    await batchRun(companies, (company) => crawlCompany(ats, company.id));
  });
}

async function crawlCompany(ats: ATS, company: string) {
  const msg = `CrawlCompany(${ats}, ${company})`;
  return logWrap(msg, async () => {
    const jobs = await getAtsJobs(ats, company);
    const jobIdSet = new Set(jobs.map((job) => job.id));
    const dbJobIds = await getJobIds(company);
    const dbJobIdSet = new Set(dbJobIds);

    // If the ATS job is not in the DB, add it
    const toAdd = jobs.filter((job) => !dbJobIdSet.has(job.id));
    console.log(`${msg}: Adding ${toAdd.length} jobs`);
    await batchRun(toAdd, (job) => addJob(job));

    // If the DB job is not in the ATS, delete it
    const toDelete = dbJobIds.filter((id) => !jobIdSet.has(id));
    console.log(`${msg}: Deleting ${toDelete.length} jobs`);
    await batchRun(toDelete, (id) => deleteJob(id, company));

    // If job is in both ATS and DB, do nothing
    console.log(`${msg}: Ignoring ${jobIdSet.size - toAdd.length} jobs`);
  });
}

async function logWrap(msg: string, func: () => Promise<void>) {
  try {
    console.log(`${msg}: Start`);
    await func();
    console.log(`${msg}: End`);
  } catch (error) {
    console.error(`${msg}: Error ${error}`);
  }
}

async function batchRun<T>(
  values: T[],
  func: (value: T) => Promise<void>,
  size: number = 5
) {
  for (let i = 0; i < values.length; i += size) {
    const batch = values.slice(i, i + size);
    const result = await Promise.allSettled(batch.map(func));

    result.forEach((r, index) => {
      if (r.status === "rejected") {
        console.error(
          `batchRun: Error at values[${i + index}]="${batch[index]}": ${
            r.reason
          }`
        );
      }
    });
  }
}