import express from "express";
import { exampleRead } from "./services/db";
import { getGreenhouseJobs } from "./services/greenhouse";
import { getLeverJobs } from "./services/lever";

export const router = express.Router();

router.get("/", async (req, res) => {
  const items = await exampleRead();
  const jobs = (await getGreenhouseJobs("example")).data;
  const lJobs = (await getLeverJobs("example")).data;

  res.send("API is working: " + JSON.stringify(lJobs[0]));
});
