import { CompanyKey } from "../models/dbModels";
import { AsyncQueue } from "../utils/asyncQueue";

const companyInfoQueue = new AsyncQueue<CompanyKey>(async (key) => {});
const companyJobsQueue = new AsyncQueue<CompanyKey>(async (key) => {});
const jobInfoQueue = new AsyncQueue<string>(async (id) => {});

export function queueCompanyInfo(key: CompanyKey) {
  companyInfoQueue.add(key);
}
