import { CompanyKey } from "../models/dbModels";
import { AsyncQueue } from "../utils/asyncQueue";

export const findCompanyInfo = new AsyncQueue<CompanyKey>(async (key) => {});
export const findCompanyJobs = new AsyncQueue<CompanyKey>(async (key) => {});
export const findJobInfo = new AsyncQueue<string>(async (id) => {});
