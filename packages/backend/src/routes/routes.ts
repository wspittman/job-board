import express, { NextFunction, Request, Response } from "express";
import {
  addCompanies,
  addCompany,
  refreshCompanies,
  refreshJobs,
  removeCompany,
} from "../controllers/company";
import { getClientJobs, removeJob, removeJobs } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { validateAdmin } from "../middleware/auth";
import {
  prepInput,
  useCompanyKey,
  useCompanyKeys,
} from "../middleware/prepInput";

type AsyncFunction = (input: any) => Promise<unknown>;

const SUCCESS = { status: "success" };

export const router = express.Router();

router.use(prepInput);

router.get(
  "/",
  jsonWrapper(() => Promise.resolve())
);

router.post(
  "/refresh/companies",
  validateAdmin,
  asyncWrapper("refreshCompanies", refreshCompanies)
);
router.post(
  "/refresh/jobs",
  validateAdmin,
  asyncWrapper("refreshJobs", refreshJobs)
);

router.put("/company", useCompanyKey, jsonWrapper(addCompany));
router.put(
  "/companies",
  validateAdmin,
  useCompanyKeys,
  jsonWrapper(addCompanies)
);
router.delete(
  "/company",
  validateAdmin,
  useCompanyKey,
  jsonWrapper(removeCompany)
);

router.get("/jobs", jsonWrapper(getClientJobs));
router.delete("/job", validateAdmin, jsonWrapper(removeJob));
router.delete("/jobs", validateAdmin, jsonWrapper(removeJobs));

router.get("/metadata", jsonWrapper(getMetadata));

function jsonWrapper(fn: AsyncFunction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(res.locals.input);
      res.json(result ?? SUCCESS);
    } catch (error: any) {
      next(error);
    }
  };
}

function asyncWrapper(name: string, fn: AsyncFunction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.writeHead(202, { "Content-Type": "text/plain" });
    res.end("Accepted");
    fn(res.locals.input);
  };
}
