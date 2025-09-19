import type { InferredCompany } from "./inferredModels.ts";

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
