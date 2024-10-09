import express from "express";
import { createCompany } from "../controllers/company";
import { jobsRouter } from "./jobs";
import { metadataRouter } from "./metadata";

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

router.use("/jobs", jobsRouter);
router.use("/metadata", metadataRouter);
