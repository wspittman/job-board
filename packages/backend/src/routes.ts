import express from "express";
import { addCompany, addJob, getCompanies, getJobs } from "./services/db";
import { getGreenhouseJobs } from "./services/greenhouse";

export const router = express.Router();

router.get("/", async (req, res) => {
  await addCompany({ id: "example", ats: "greenhouse" });

  const companies = await getCompanies("greenhouse");

  console.log(companies);

  const [company] = companies;
  const jobs = await getGreenhouseJobs(company.id);
  //const lJobs = await getLeverJobs(company.id));

  await Promise.all(jobs.map((job) => addJob(job)));

  const dbJobs = await getJobs(company.id);

  res.send("API is working: " + JSON.stringify(dbJobs[0]));
});
