import express from "express";
import { crawl } from "./crawler";
import { addCompany, validateCompany } from "./db/company";
import { getJobs } from "./db/job";

export const router = express.Router();

router.get("/", (_, res) => {
  res.send("API is working");
});

router.get("/jobs", async (req, res, next) => {
  try {
    const company = req.query.company as string;

    if (!company) {
      return res.json([]);
    }

    const jobs = await getJobs(company);

    res.json(jobs);
  } catch (error: any) {
    next(error);
  }
});

// TBD Admin Auth
router.put("/company", async (req, res, next) => {
  try {
    const company = validateCompany(req.body);

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

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});
