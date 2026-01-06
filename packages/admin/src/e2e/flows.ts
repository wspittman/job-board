import { type Step, formErrStep, formStep, formSucStep } from "./step.ts";

const GREENHOUSE_EXAMPLE = "vaulttec";

const pings: Step[] = [
  formSucStep("", "Ping"),
  formStep("unknown", "404", { expectStatus: 404, expectBody: "Not Found" }),
  formStep("jobs", "Empty Query", { expectBody: [] }),
  formStep("metadata", "Status check", { expectBody: {} }),
];

const errors: Step[] = [
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

export const flows: Record<string, Step[]> = {
  pings,
  errors,
  smoke: [...pings, ...errors],
};
