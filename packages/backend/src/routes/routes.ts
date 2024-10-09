import express, { NextFunction, Request, Response } from "express";
import { createCompany } from "../controllers/company";
import { crawlJobs, getJobs } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { validateAdmin } from "../middleware/auth";
import { convertQuery, getQuery } from "../middleware/querystring";

export const router = express.Router();

router.use(convertQuery);

router.get(
  "/",
  jsonWrapper(() => Promise.resolve())
);

router.put(
  "/company",
  jsonWrapper((req) => createCompany(req.body))
);

router.get(
  "/jobs",
  jsonWrapper((req, res) => getJobs(getQuery(res)))
);

router.post(
  "/jobs",
  validateAdmin,
  jsonWrapper(() => crawlJobs())
);

router.get(
  "/metadata",
  jsonWrapper(() => getMetadata())
);

function jsonWrapper(fn: (req: Request, res: Response) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (await fn(req, res)) ?? { status: "success" };
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };
}
