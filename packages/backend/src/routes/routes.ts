import express from "express";
import {
  addCompanies,
  addCompany,
  refreshCompanies,
  refreshJobs,
  removeCompany,
} from "../controllers/company.ts";
import { getApplyRedirectUrl, getJobs, removeJob } from "../controllers/job.ts";
import { getMetadata } from "../controllers/metadata.ts";
import { adminOnly } from "../middleware/auth.ts";
import {
  useCompanyKey,
  useCompanyKeys,
  useFilters,
  useJobKey,
  useRefreshJobsOptions,
} from "../middleware/inputValidators.ts";
import {
  asyncRoute,
  jsonRoute,
  redirectRoute,
} from "../middleware/wrappers.ts";
import { toClientJobs } from "../models/toClient.ts";

export const router = express.Router();

router.get(
  "/",
  jsonRoute(() => Promise.resolve())
);

router.post("/refresh/companies", adminOnly, asyncRoute(refreshCompanies));
router.post(
  "/refresh/jobs",
  adminOnly,
  asyncRoute(refreshJobs, useRefreshJobsOptions)
);

router.put("/company", jsonRoute(addCompany, useCompanyKey));
router.put("/companies", adminOnly, jsonRoute(addCompanies, useCompanyKeys));
router.delete("/company", adminOnly, jsonRoute(removeCompany, useCompanyKey));

router.get("/job/apply", redirectRoute(getApplyRedirectUrl, useJobKey));
router.get("/jobs", jsonRoute(getJobs, useFilters, toClientJobs));
router.delete("/job", adminOnly, jsonRoute(removeJob, useJobKey));

router.get("/metadata", jsonRoute(getMetadata));
