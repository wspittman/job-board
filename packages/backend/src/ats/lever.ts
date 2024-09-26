import axios from "axios";
import { AppError } from "../AppError";
import { config } from "../config";
import type { Company, CompanyInput } from "../db/company";
import type { Job } from "../db/job";
import { checkStatus } from "./utils";

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
  openingPlain: string;
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

export async function getLeverCompany(company: CompanyInput): Promise<Company> {
  const result = await axios.get<LeverJob[]>(
    `${config.LEVER_URL}/${company.id}?mode=json&limit=1`
  );

  checkStatus(result, ["Lever", company.id]);

  if (!result.data.length) {
    // Since we can't gather proper name/description, treat as not found
    throw new AppError(`Lever / ${company.id}: Not Found`, 404);
  }

  const { openingPlain } = result.data[0];

  return {
    ...company,
    // No name field, just use token until we have a better solution
    name: company.id,
    description: openingPlain,
  };
}

export async function getLeverJobs(company: Company): Promise<Job[]> {
  const result = await axios.get<LeverJob[]>(
    `${config.LEVER_URL}/${company.id}?mode=json`
  );

  checkStatus(result, ["Lever", company.id]);

  return result.data.map((job) => ({
    id: job.id,
    companyId: company.id,
    company: company.name,
    title: job.text,
    // Simple keyword match for now
    isRemote:
      job.workplaceType === "remote" ||
      job.categories.allLocations.some((x) =>
        x.toLowerCase().includes("remote")
      ),
    location: job.categories.allLocations.join(" OR "),
    description: job.descriptionPlain,
    postDate: new Date(job.createdAt).toISOString(),
    applyUrl: job.applyUrl,
  }));
}
