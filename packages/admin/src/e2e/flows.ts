import { config } from "../config.ts";
import { type Step, formErrStep, formStep, formSucStep } from "./step.ts";

const { GREENHOUSE_IDS } = config;

const GREENHOUSE_EXAMPLE = GREENHOUSE_IDS[0];

const pings: Step[] = [
  formSucStep("", "Ping"),
  formStep("unknown", "404", { expectStatus: 404, expectBody: "Not Found" }),
  formStep("jobs", "Empty Query", { expectBody: [] }),
  formStep("metadata", "Status check", { expectBody: {} }),
];

const validations: Step[] = [
  // Refresh Jobs
  formErrStep("refresh/jobs", "Auth Missing", "Unauthorized", {
    method: "POST",
    expectStatus: 401,
  }),
  formErrStep(
    "refresh/jobs",
    "Unknown Arg Error",
    'Unrecognized key: "unknownArg"',
    {
      method: "POST",
      asAdmin: true,
      body: {
        ats: "greenhouse",
        companyId: GREENHOUSE_EXAMPLE,
        unknownArg: "nope",
      },
    },
  ),
  formErrStep(
    "refresh/jobs",
    "Company without ATS Error",
    "ats field is required when using companyId",
    {
      method: "POST",
      asAdmin: true,
      body: {
        companyId: GREENHOUSE_EXAMPLE,
      },
    },
  ),
  formErrStep(
    "refresh/jobs",
    "Unknown ATS Error",
    'ats field is invalid: Invalid option: expected one of "greenhouse"|"lever"',
    {
      method: "POST",
      asAdmin: true,
      body: {
        ats: "unknown",
        companyId: GREENHOUSE_EXAMPLE,
      },
    },
  ),

  // Company
  formErrStep(
    "company",
    "Empty Body Error",
    "id field is invalid: Invalid input: expected string, received undefined",
    {
      method: "PUT",
      body: {},
    },
  ),
  formErrStep(
    "companies",
    "Empty Body Error",
    "ids field is invalid: Invalid input: expected array, received undefined",
    {
      method: "PUT",
      asAdmin: true,
      body: {},
    },
  ),
  formErrStep(
    "companies",
    "Empty IDs Error",
    "ids field is invalid: Too small: expected array to have >=1 items",
    {
      method: "PUT",
      asAdmin: true,
      body: { ats: "greenhouse", ids: [] },
    },
  ),
  formErrStep(
    "company",
    "Empty Body Error",
    "id field is invalid: Invalid input: expected string, received undefined",
    {
      method: "DELETE",
      asAdmin: true,
      body: {},
    },
  ),

  // Job
  formErrStep(
    "job/apply",
    "Missing Query Error",
    "id field is invalid: Invalid input: expected string, received undefined",
    {},
  ),
  formErrStep("job/apply", "Not Found Error", "Job not found", {
    query: {
      id: "unknown_job_id",
      companyId: "unknown_company_id",
    },
    expectStatus: 404,
  }),
  formErrStep(
    "job",
    "Empty Body Error",
    "id field is invalid: Invalid input: expected string, received undefined",
    {
      method: "DELETE",
      asAdmin: true,
      body: {},
    },
  ),
];

/*
/refresh/companies
(async -> trigger company info queue -> company metadata executor)

/refresh/jobs
/refresh/jobs for specific ATS
/refresh/jobs for specific, but unknown, company
/refresh/jobs for specific company
/refresh/jobs for the same specific company (no changes expected)
/refresh/jobs for specific company with replaceJobsOlderThan=now
(async -> trigger job info queue -> metadata job executor)

/company add company (greenhouse, lever, re-add, unknown)
(async -> trigger company info queue -> company metadata executor)

/companies add companies ([greenhouse, lever, re-add, unknown])
(async -> trigger company info queue -> company metadata executor)

/company delete company (good, unknown)
(async -> trigger company metadata executor)
(if jobs -> delete jobs and trigger job metadata executor)

/job/apply (greenhouse, lever, unknown (err))

/jobs (specific company)

/job delete job (good, unknown)
*/

/*
TBD: reading metadata specifically to diffing expected changes?
  Stop option: meta baseline, meta comparison?
*/

export const flows: Record<string, Step[]> = {
  pings,
  validations,
  smoke: [...pings, ...validations],
};
