import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { AsyncQueue } from "../utils/asyncQueue";

const companyInfoQueue = new AsyncQueue<CompanyKey>(refreshCompanyInfo);
const companyJobQueue = new AsyncQueue<CompanyKey>(refreshCompanyJobs);

export async function getCompany(key: CompanyKey) {
  return db.company.get(key);
}

export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(key);
}

export async function addCompanies({ ids, ats }: CompanyKeys) {
  return batchRun(ids, (id) => addCompanyInternal({ id, ats }), "AddCompanies");
}

export async function removeCompany(key: CompanyKey) {
  // TODO: Delete company's jobs also
  return db.company.remove(key);
}

export async function refreshCompanies() {
  // TODO: WithAsyncContext
  const keys = await db.company.getKeys();
  // TODO: How does metadata clearing fit in here?
  companyInfoQueue.addMany(keys);
}

export async function refreshJobs() {
  // TODO: WithAsyncContext
  const keys = await db.company.getKeys();
  // TODO: How does metadata clearing fit in here?
  companyJobQueue.addMany(keys);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.companyInit(key);
  if (!company) return;

  await db.company.upsert(company);
  companyInfoQueue.add(company);
}

async function refreshCompanyInfo(key: CompanyKey) {
  // TODO: WithAsyncContext
  const { company, context } = await ats.companyInfo(key);
  // extracts into company object
  await llm.extractCompanyInfo(company, context);
  db.company.upsert(company);

  //TODO: Update company metadata object
}

async function refreshCompanyJobs(key: CompanyKey) {
  const ids = await db.job.getIdsByPartitionKey(key.id);
  /*
   DB: Read in all job ids for the company id (partition key)
  If no jobs are found, assume newly added company
    ATS: Make an API call fetching the full JD data for all jobs with this company id
  else 
    ATS: Make an API call fetching the id-minimal data for all jobs with this company id
      Greenhouse allows id-minimal, but Lever doesn't
  Figure out which jobs are added/removed/ignored
  If 9 * added.length > removed.length + ignored.length (the percentage of added jobs is above 10%)
    ATS: Make an API call fetching the full JD data for all jobs with this company id
  If any jobs are removed:
    In Parallel Batches, do this for each removed job:
      DB: Delete the job
      Update the cached job metadata object
        DB: Upsert the metadata object
          on a debounce-like timer, 5 seconds of no updates updates metadata prep?
          And 60 seconds of no updates updates metadata prime?
  If any jobs are added:
    Queue<{ CompanyKey, JobKey, ATSContext }>(FindJobInfo): Add all added jobs
  */
}
