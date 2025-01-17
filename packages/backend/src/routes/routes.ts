import express from "express";
import {
  addCompanies,
  addCompany,
  refreshCompanies,
  refreshJobs,
  removeCompany,
} from "../controllers/company";
import { getClientJobs, removeJob } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { adminOnly } from "../middleware/auth";
import { useCompanyKey, useCompanyKeys } from "../middleware/inputValidators";
import { asyncRoute, jsonRoute } from "../middleware/wrappers";

export const router = express.Router();

router.get(
  "/",
  jsonRoute(() => Promise.resolve())
);

router.post(
  "/refresh/companies",
  adminOnly,
  asyncRoute("refreshCompanies", refreshCompanies)
);
router.post("/refresh/jobs", adminOnly, asyncRoute("refreshJobs", refreshJobs));

router.put("/company", jsonRoute(addCompany, useCompanyKey));
router.put("/companies", adminOnly, jsonRoute(addCompanies, useCompanyKeys));
router.delete("/company", adminOnly, jsonRoute(removeCompany, useCompanyKey));

router.get("/jobs", jsonRoute(getClientJobs));
router.delete("/job", adminOnly, jsonRoute(removeJob));

router.get("/metadata", jsonRoute(getMetadata));
