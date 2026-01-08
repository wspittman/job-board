import { config } from "../config.ts";
import {
  type Step,
  formAsyncStep,
  formErrStep,
  formStep,
  formSucStep,
} from "./step.ts";

const { GREENHOUSE_IDS } = config;

const GREENHOUSE_EXAMPLE = GREENHOUSE_IDS[0];
const UNKNOWN = "unknown_id";

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
        unknownArg: UNKNOWN,
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
        ats: UNKNOWN,
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
      id: UNKNOWN,
      companyId: UNKNOWN,
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

const unknowns: Step[] = [
  formAsyncStep("refresh/jobs", "Unknown Company", {
    method: "POST",
    asAdmin: true,
    body: {
      ats: "greenhouse",
      companyId: UNKNOWN,
    },
  }),
  formErrStep(
    "company",
    "Unknown Company",
    `greenhouse / ${UNKNOWN}: Not Found`,
    {
      method: "PUT",
      body: {
        ats: "greenhouse",
        id: UNKNOWN,
      },
      expectStatus: 404,
    },
  ),
  formSucStep("companies", "Unknown Companies", {
    method: "PUT",
    asAdmin: true,
    body: {
      ats: "greenhouse",
      ids: [UNKNOWN, UNKNOWN + "2", UNKNOWN + "3"],
    },
    asyncWait: "Verify internal Not Found exceptions",
  }),
  formSucStep("company", "Unknown Company", {
    method: "DELETE",
    asAdmin: true,
    body: {
      ats: "greenhouse",
      id: UNKNOWN,
    },
  }),
  formSucStep("job", "Unknown Company", {
    method: "DELETE",
    asAdmin: true,
    body: {
      id: UNKNOWN,
      companyId: UNKNOWN,
    },
  }),
  formSucStep("job", "Unknown Job", {
    method: "DELETE",
    asAdmin: true,
    body: {
      id: UNKNOWN,
      companyId: GREENHOUSE_EXAMPLE,
    },
  }),
];

/*
Flow:
/company delete company GH1
/company delete company LV1
-> Metadata baseline
/company add company GH1
/company add company LV1
...

/refresh/companies
(async -> trigger company info queue -> company metadata executor)

/refresh/jobs
/refresh/jobs for specific ATS
/refresh/jobs for specific company
/refresh/jobs for the same specific company (no changes expected)
/refresh/jobs for specific company with replaceJobsOlderThan=now
(async -> trigger job info queue -> metadata job executor)

/company add company (greenhouse, lever, re-add)
(async -> trigger company info queue -> company metadata executor)

/companies add companies ([greenhouse, lever, re-add])
(async -> trigger company info queue -> company metadata executor)

/company delete company (good)
(async -> trigger company metadata executor)
(if jobs -> delete jobs and trigger job metadata executor)

/job/apply (greenhouse, lever)

/jobs (specific company)

/job delete job (specific job)
*/

/*
TBD: reading metadata specifically to diffing expected changes?
  Stop option: meta baseline, meta comparison?
*/

export const flows: Record<string, Step[]> = {
  pings,
  validations,
  unknowns,
  smoke: [...pings, ...validations, ...unknowns],
};
