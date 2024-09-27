import express from "express";
import { fillCompanyInput } from "./ats/ats";
import { crawl } from "./crawler";
import { addCompany, validateCompanyInput } from "./db/company";
import { getJobs, validateFilters } from "./db/job";
import { getMetadata, renewMetadata } from "./db/metadata";

export const router = express.Router();

router.get("/", (_, res) => {
  res.send("API is working");
});

router.get("/metadata", async (_, res, next) => {
  try {
    const metadata = await getMetadata();
    res.json(metadata);
  } catch (error: any) {
    next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const filters = validateFilters(req.query);

    if (!Object.keys(filters).length) {
      return res.json([]);
    }

    const jobs = await getJobs(filters);

    res.json(jobs);
  } catch (error: any) {
    next(error);
  }
});

router.put("/company", async (req, res, next) => {
  try {
    const input = validateCompanyInput(req.body);
    const company = await fillCompanyInput(input);

    await addCompany(company);

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});

// TBD Admin Auth
router.post("/jobs", async (_, res, next) => {
  try {
    await crawl();
    await renewMetadata();

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});
