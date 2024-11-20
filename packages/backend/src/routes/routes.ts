import express, { NextFunction, Request, Response } from "express";
import {
  addCompanies,
  addCompany,
  removeCompany,
} from "../controllers/company";
import { addJobs, getJobs, removeJob, removeJobs } from "../controllers/job";
import { getMetadata } from "../controllers/metadata";
import { validateAdmin } from "../middleware/auth";
import { prepInput } from "../middleware/prepInput";

export const router = express.Router();

router.use(prepInput);

router.get(
  "/",
  jsonWrapper(() => Promise.resolve())
);

router.put("/company", jsonWrapper(addCompany));
router.put("/companies", validateAdmin, jsonWrapper(addCompanies));
router.delete("/company", validateAdmin, jsonWrapper(removeCompany));

router.get("/jobs", jsonWrapper(getJobs));
router.post("/jobs", validateAdmin, asyncWrapper(addJobs));
router.delete("/job", validateAdmin, jsonWrapper(removeJob));
router.delete("/jobs", validateAdmin, jsonWrapper(removeJobs));

router.get("/metadata", jsonWrapper(getMetadata));

function jsonWrapper(fn: (input: any) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (await fn(res.locals.input)) ?? { status: "success" };
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };
}

function asyncWrapper(fn: (input: any) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.writeHead(202, { "Content-Type": "text/plain" });
      res.end("Accepted");
      await fn(res.locals.input);
    } catch (error: any) {
      next(error);
    }
  };
}
