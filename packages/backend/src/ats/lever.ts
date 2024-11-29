import { AppError } from "../AppError";
import { config } from "../config";
import type { Company, Job } from "../db/models";
import { standardizeUntrustedHtml } from "../utils/html";
import type { AtsEndpoint } from "./types";

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
  description: string;
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

export class Lever implements AtsEndpoint {
  getCompanyEndpoint(id: string): string {
    return `${config.LEVER_URL}/${id}?mode=json&limit=1`;
  }

  getJobsEndpoint(id: string): string {
    return `${config.LEVER_URL}/${id}?mode=json`;
  }

  formatCompany(id: string, data: LeverJob[]): Company {
    if (!data.length) {
      // Since we can't gather proper name/description, treat as not found
      throw new AppError(`Lever / ${id}: Not Found`, 404);
    }

    const { openingPlain } = data[0];

    return {
      id,
      ats: "lever",
      // No name field, just use token until we have a better solution
      name: id,
      description: openingPlain,
    };
  }

  getRawJobs(data: LeverJob[]): [string, LeverJob][] {
    return data.map((job) => [job.id, job]);
  }

  formatJobs(company: Company, jobs: LeverJob[]): Job[] {
    return jobs.map((job) => {
      return {
        id: job.id,
        companyId: company.id,
        company: company.name,
        title: job.text,
        isRemote:
          job.workplaceType === "remote" ||
          job.categories.allLocations.some((x) =>
            x.toLowerCase().includes("remote")
          ),
        location: `${job.workplaceType}: [${job.categories.allLocations.join(
          "; "
        )}]`,
        description: standardizeUntrustedHtml(job.description),
        postTS: new Date(job.createdAt).getTime(),
        applyUrl: job.applyUrl,
        facets: {},
      };
    });
  }
}
