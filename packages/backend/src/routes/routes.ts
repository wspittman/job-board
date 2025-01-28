import express from "express";
import {
  addCompanies,
  addCompany,
  refreshCompanies,
  refreshJobs,
  removeCompany,
} from "../controllers/company";
import { getJobs, removeJob } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { adminOnly } from "../middleware/auth";
import {
  useCompanyKey,
  useCompanyKeys,
  useFilters,
  useJobKey,
  useRefreshJobsOptions,
} from "../middleware/inputValidators";
import { asyncRoute, jsonRoute } from "../middleware/wrappers";
import { toClientJobs } from "../types/toClient";

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

router.get("/jobs", jsonRoute(getJobs, useFilters, toClientJobs));
router.delete("/job", adminOnly, jsonRoute(removeJob, useJobKey));

router.get("/metadata", jsonRoute(getMetadata));
