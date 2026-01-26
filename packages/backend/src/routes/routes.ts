import express from "express";
import { addCompany } from "../controllers/company.ts";
import { getApplyRedirectUrl, getJobs } from "../controllers/job.ts";
import { getMetadata } from "../controllers/metadata.ts";
import { adminRouter } from "./adminRoutes.ts";
import {
  useBeacon,
  useCompanyKey,
  useFilters,
  useJobKey,
} from "../middleware/inputValidators.ts";
import {
  beaconRoute,
  jsonRoute,
  redirectRoute,
} from "../middleware/wrappers.ts";
import { toClientJobs } from "../models/toClient.ts";

export const router = express.Router();

router.get(
  "/",
  jsonRoute(() => Promise.resolve()),
);
router.post("/beacon", express.text(), beaconRoute(useBeacon));

router.put("/company", jsonRoute(addCompany, useCompanyKey));

router.get("/job/apply", redirectRoute(getApplyRedirectUrl, useJobKey));
router.get("/jobs", jsonRoute(getJobs, useFilters, toClientJobs));

router.get("/metadata", jsonRoute(getMetadata));

router.use(adminRouter);
