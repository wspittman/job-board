import express from "express";
import {
  addCompanies,
  refreshCompanies,
  refreshJobs,
  removeCompany,
} from "../controllers/company.ts";
import { removeJob } from "../controllers/job.ts";
import { adminOnly } from "../middleware/auth.ts";
import {
  useCompanyKey,
  useCompanyKeys,
  useJobKey,
  useRefreshJobsOptions,
} from "../middleware/inputValidators.ts";
import { asyncRoute, jsonRoute } from "../middleware/wrappers.ts";

/**
 * Admin-only API routes mounted under the main API router.
 */
export const adminRouter = express.Router();

adminRouter.post("/refresh/companies", adminOnly, asyncRoute(refreshCompanies));
adminRouter.post(
  "/refresh/jobs",
  adminOnly,
  asyncRoute(refreshJobs, useRefreshJobsOptions),
);

adminRouter.put(
  "/companies",
  adminOnly,
  jsonRoute(addCompanies, useCompanyKeys),
);
adminRouter.delete(
  "/company",
  adminOnly,
  jsonRoute(removeCompany, useCompanyKey),
);
adminRouter.delete("/job", adminOnly, jsonRoute(removeJob, useJobKey));
