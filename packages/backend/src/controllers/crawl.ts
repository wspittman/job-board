import { CompanyKey } from "../db/models";
import { AsyncQueue } from "../utils/asyncQueue";

export const findCompanyInfo = new AsyncQueue<CompanyKey>(async (key) => {});
