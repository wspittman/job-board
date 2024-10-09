import express, { Request } from "express";
import { createCompany } from "../controllers/company";
import { crawlJobs, getJobs } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";

export const router = express.Router();

router.get("/", (_, res) => {
  res.send("API is working");
});

router.put("/company", async (req, res, next) => {
  try {
    createCompany(req.body);

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const jobs = await getJobs(queryToDict(req.query));

    res.json(jobs);
  } catch (error: any) {
    next(error);
  }
});

// TBD Admin Auth
router.post("/jobs", async (_, res, next) => {
  try {
    await crawlJobs();

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});

router.get("/metadata", async (_, res, next) => {
  try {
    const metadata = await getMetadata();
    res.json(metadata);
  } catch (error: any) {
    next(error);
  }
});

function queryToDict(query: Request["query"]) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length) {
      result[key] = value;
    }
  }

  return result;
}
