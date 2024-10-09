import express from "express";
import { crawl } from "../crawler";
import { getJobs, validateFilters } from "../db/job";
import { renewMetadata } from "../db/metadata";

export const jobsRouter = express.Router();

jobsRouter.get("/", async (req, res, next) => {
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

// TBD Admin Auth
jobsRouter.post("/", async (_, res, next) => {
  try {
    await crawl();
    await renewMetadata();

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});
