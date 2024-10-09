import express from "express";
import { companyRouter } from "./company";
import { jobsRouter } from "./jobs";
import { metadataRouter } from "./metadata";

export const router = express.Router();

router.get("/", (_, res) => {
  res.send("API is working");
});

router.use("/company", companyRouter);
router.use("/jobs", jobsRouter);
router.use("/metadata", metadataRouter);
