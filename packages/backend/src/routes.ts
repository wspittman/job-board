import express from "express";
import { fillCompanyInput } from "./ats/ats";
import { crawl } from "./crawler";
import { addCompany, validateCompanyInput } from "./db/company";
import { getJobs } from "./db/job";

export const router = express.Router();

router.get("/", (_, res) => {
  res.send("API is working");
});

router.get("/jobs", async (req, res, next) => {
  try {
    const companyId = req.query.companyId as string;

    if (!companyId) {
      return res.json([]);
    }

    const jobs = await getJobs(companyId);

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

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});
