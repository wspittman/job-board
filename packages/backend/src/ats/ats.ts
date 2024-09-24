import { getGreenhouseJobs } from "./greenhouse";
import { getLeverJobs } from "./lever";

export enum ATS {
  GREENHOUSE = "greenhouse",
  LEVER = "lever",
}

export async function getAtsJobs(ats: ATS, company: string) {
  switch (ats) {
    case ATS.GREENHOUSE:
      return getGreenhouseJobs(company);
    case ATS.LEVER:
      return getLeverJobs(company);
  }
}
