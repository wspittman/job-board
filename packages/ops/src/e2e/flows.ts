import { config } from "../config.ts";
import {
  type Step,
  addCompaniesStep,
  addCompanyStep,
  delCompanyStep,
  formAsyncStep,
  formErrStep,
  formStep,
  formSucStep,
  resetSteps,
} from "./step.ts";

const { GREENHOUSE_IDS: ghIds, LEVER_IDS: lvIds } = config;

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
        companyId: ghIds[0],
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
        companyId: ghIds[0],
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
        companyId: ghIds[0],
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
  addCompaniesStep(
    "greenhouse",
    [UNKNOWN, UNKNOWN + "2", UNKNOWN + "3"],
    "Verify internal Not Found exceptions",
  ),
  delCompanyStep("greenhouse", UNKNOWN),
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
      companyId: ghIds[0],
    },
  }),
];

const companies: Step[] = [
  ...resetSteps,
  // Metadata baseline would go here
  // Add one company from each ATS
  addCompanyStep("greenhouse", ghIds[0]!),
  addCompanyStep("lever", lvIds[0]!),
  // Re-add the same companies to test idempotency
  addCompanyStep("greenhouse", ghIds[0]!),
  addCompanyStep("lever", lvIds[0]!),
  // Add multiple companies from each ATS
  addCompaniesStep("greenhouse", ghIds),
  addCompaniesStep("lever", lvIds, "Verify company metadata executor"),
  // Metadata check would go here
  formAsyncStep("refresh/companies", "Refresh All Companies"),
  // Metadata check would go here
];

const manual = [
  //addCompanyStep("greenhouse", "noxgroup"),
  formSucStep("refresh/jobs", "Refresh Nox Group Jobs", {
    method: "POST",
    asAdmin: true,
    body: {
      ats: "greenhouse",
      companyId: "noxgroup",
      replaceJobsOlderThan: Date.now(),
    },
  }),
];

/*
To be added to a flow:

/refresh/jobs
/refresh/jobs for specific ATS
/refresh/jobs for specific company
/refresh/jobs for specific company (does not exist)
/refresh/jobs for the same specific company (no changes expected)
/refresh/jobs for specific company with replaceJobsOlderThan=now
(async -> trigger job info queue -> job metadata executor)

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
  companies,
  smoke: [...pings, ...validations, ...unknowns, ...companies],
  manual,
};
