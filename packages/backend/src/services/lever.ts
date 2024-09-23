import axios from "axios";
import { config } from "../config";
import { Job } from "../db/db";

interface LeverJob {
  id: string;
  text: string;
  categories: {
    commitment: string;
    location: string;
    team: string;
    department: string;
    allLocations: string[];
  };
  country: string;
  // Available in dual properties of description (styles HTML) and descriptionPlain (plaintext)
  // Also there are opening\openingPlain, and descriptionBody\descriptionBodyPlain, which are subsets of description
  descriptionPlain: string;
  lists: {
    text: string;
    content: string;
  }[];
  additionalPlain: string;
  hostedUrl: string;
  applyUrl: string;
  workplaceType: "unspecified" | "on-site" | "remote" | "hybrid";
  salaryRange?: {
    currency: string;
    interval: string;
    min: number;
    max: number;
  };
  salaryDescriptionPlain?: string;
  createdAt: number;
}

export async function getLeverJobs(company: string): Promise<Job[]> {
  const rawJobs = (
    await axios.get<LeverJob[]>(`${config.LEVER_URL}/${company}?mode=json`)
  ).data;

  return rawJobs.map((job) => ({
    company,
    title: job.text,
    description: job.descriptionPlain,
    postDate: new Date(job.createdAt).toISOString(),
    applyUrl: job.applyUrl,
  }));
}
