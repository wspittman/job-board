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
import { logAsyncEvent, logError } from "../utils/telemetry";

type AsyncFunction = (input: any) => Promise<unknown>;

const SUCCESS = { status: "success" };

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
router.post("/jobs", validateAdmin, asyncWrapper("addJobs", addJobs));
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
    const start = Date.now();
    try {
      res.writeHead(202, { "Content-Type": "text/plain" });
      res.end("Accepted");
      await fn(res.locals.input);
    } catch (error: any) {
      logError(error);
    } finally {
      const duration = Date.now() - start;
      logAsyncEvent(name, duration);
    }
  };
}
