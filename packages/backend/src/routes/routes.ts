import express from "express";
import {
  addCompanies,
  addCompany,
  removeCompany,
} from "../controllers/company";
import {
  addJobs,
  getClientJobs,
  removeJob,
  removeJobs,
} from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { adminOnly } from "../middleware/auth";
import {
  useCompanyKey,
  useCompanyKeys,
  useFilters,
  useJobKey,
} from "../middleware/inputValidators";
import { asyncRoute, jsonRoute } from "../middleware/wrappers";

export const router = express.Router();

router.get(
  "/",
  jsonRoute(() => Promise.resolve())
);

router.put("/company", jsonRoute(addCompany, useCompanyKey));
router.put("/companies", adminOnly, jsonRoute(addCompanies, useCompanyKeys));
router.delete("/company", adminOnly, jsonRoute(removeCompany, useCompanyKey));

router.get("/jobs", jsonRoute(getClientJobs, useFilters));
// Ignore input: crawl updates incoming
router.post("/jobs", adminOnly, asyncRoute("addJobs", addJobs));
router.delete("/job", adminOnly, jsonRoute(removeJob, useJobKey));
// Ignore input: route on chopping block
router.delete("/jobs", adminOnly, jsonRoute(removeJobs));

router.get("/metadata", jsonRoute(getMetadata));
