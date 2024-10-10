import { getAts } from "./ats/ats";
import { ATS } from "./ats/types";
import { Company, getCompanies } from "./controllers/company";
import { addJob, deleteJob, getJobIds } from "./controllers/job";
import { batchRun, logWrap } from "./utils/async";

// TODO: This might take longer than the request timeout
export async function crawl() {
  return logWrap("Crawl", async () => {
    await Promise.all(Object.values(ATS).map(crawlAts));
  });
}

async function crawlAts(ats: ATS) {
  return logWrap(`CrawlAts(${ats})`, async () => {
    const companies = await getCompanies(ats);
    await batchRun(companies, (company) => crawlCompany(company));
  });
}

async function crawlCompany(company: Company) {
  const msg = `CrawlCompany(${company.ats}, ${company.id})`;
  return logWrap(msg, async () => {
    const jobs = await getAts(company.ats).getJobs(company);
    const jobIdSet = new Set(jobs.map((job) => job.id));
    const dbJobIds = await getJobIds(company.id);
    const dbJobIdSet = new Set(dbJobIds);

    // If the ATS job is not in the DB, add it
    const toAdd = jobs.filter((job) => !dbJobIdSet.has(job.id));
    console.log(`${msg}: Adding ${toAdd.length} jobs`);
    await batchRun(toAdd, (job) => addJob(job));

    // If the DB job is not in the ATS, delete it
    const toDelete = dbJobIds.filter((id) => !jobIdSet.has(id));
    console.log(`${msg}: Deleting ${toDelete.length} jobs`);
    await batchRun(toDelete, (id) => deleteJob(id, company.id));

    // If job is in both ATS and DB, do nothing
    console.log(`${msg}: Ignoring ${jobIdSet.size - toAdd.length} jobs`);
  });
}
