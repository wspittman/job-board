import { ATS, getCompanies } from "./db/company";
import { addJob, Job } from "./db/job";
import { getGreenhouseJobs } from "./services/greenhouse";
import { getLeverJobs } from "./services/lever";

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
  return logWrap(`CrawlCompany(${ats} ${company})`, async () => {
    const jobs = await getJobs(ats, company);
    await batchRun(jobs, (job) => insertJob(ats, company, job));
  });
}

async function insertJob(ats: ATS, company: string, job: Job) {
  return logWrap(`InsertJob(${ats} ${company} ${job?.title})`, async () => {
    // TBD: More processing goes here
    await addJob(job);
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

async function getJobs(ats: ATS, company: string) {
  switch (ats) {
    case ATS.GREENHOUSE:
      return getGreenhouseJobs(company);
    case ATS.LEVER:
      return getLeverJobs(company);
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
