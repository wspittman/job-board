import express from "express";
import { addCompany } from "../controllers/company.ts";
import { interpretFilters } from "../controllers/interpret.ts";
import { getApplyRedirectUrl, getJobs } from "../controllers/job.ts";
import { getCompanyQuickRef, getMetadata } from "../controllers/metadata.ts";
import {
  useBeacon,
  useCompanyKey,
  useFilters,
  useInterpretQuery,
  useJobKey,
} from "../middleware/inputValidators.ts";
import {
  beaconRoute,
  jsonRoute,
  redirectRoute,
} from "../middleware/wrappers.ts";
import { setGetCompanyQuickRef, toClientJobs } from "../models/toClient.ts";
import { adminRouter } from "./adminRoutes.ts";

// Dumb but makes testing and passing easier
setGetCompanyQuickRef(getCompanyQuickRef);

export const router = express.Router();

router.get(
  "/",
  jsonRoute(() => Promise.resolve()),
);
router.post("/beacon", express.text(), beaconRoute(useBeacon));

router.put("/company", jsonRoute(addCompany, useCompanyKey));

router.get("/job/apply", redirectRoute(getApplyRedirectUrl, useJobKey));
router.get("/jobs", jsonRoute(getJobs, useFilters, toClientJobs));

router.post("/interpret", jsonRoute(interpretFilters, useInterpretQuery));

router.get("/metadata", jsonRoute(getMetadata));

router.use(adminRouter);
