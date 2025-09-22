import type { InferredCompany, InferredJob } from "./inferredModels.ts";

export type ATS = "greenhouse" | "lever";

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export interface CompanyKey {
  id: string;
  ats: ATS;
}

export interface CompanyKeys {
  ids: CompanyKey["id"][];
  ats: CompanyKey["ats"];
}

export type Company = CompanyKey &
  Partial<InferredCompany> & {
    name: string;
  };

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface JobKey {
  id: string;
  companyId: string;
}

export type Job = JobKey &
  Partial<InferredJob> & {
    title: string;
    description: string;
    postTS: number;
    applyUrl: string;

    // Denormalized from Company to reduce joins
    companyName: Company["name"];
    // TBD
    //companyStage?: Company["stage"];
    //companySize?: Company["size"];
  };
