import express from "express";
import { addCompany, ATS, getCompanies } from "./db/company";
import { addJob, getJobs } from "./db/job";
import { getGreenhouseJobs } from "./services/greenhouse";

export const router = express.Router();

router.get("/", async (req, res) => {
  await addCompany({ id: "example", ats: ATS.GREENHOUSE });

  const companies = await getCompanies(ATS.GREENHOUSE);

  console.log(companies);

  const [company] = companies;
  const jobs = await getGreenhouseJobs(company.id);
  //const lJobs = await getLeverJobs(company.id));

  await Promise.all(jobs.map((job) => addJob(job)));

  const dbJobs = await getJobs(company.id);

  res.send("API is working: " + JSON.stringify(dbJobs[0]));
});
