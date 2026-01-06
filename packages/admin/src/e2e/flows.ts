import { type Step, formErrStep, formStep, formSucStep } from "./step.ts";

const GREENHOUSE_EXAMPLE = "vaulttec";

const pings: Step[] = [
  formSucStep("Ping", ""),
  formStep("404", "fourohfour", { expectStatus: 404, expectBody: "Not Found" }),
  formStep("Empty Jobs Query", "jobs", { expectBody: [] }),
  formStep("Metadata", "metadata", { expectBody: {} }),
];

const errors: Step[] = [
  formErrStep("Auth Missing", "refresh/jobs", "Unauthorized", {
    method: "POST",
    expectStatus: 401,
  }),

  // Company
  formErrStep(
    "Company Error: Empty Body",
    "company",
    "id field is invalid: Invalid input: expected string, received undefined",
    {
      method: "PUT",
      body: {},
    },
  ),
  formErrStep(
    "Company Error: Empty IDs",
    "companies",
    "ids field is invalid: Too small: expected array to have >=1 items",
    {
      method: "PUT",
      asAdmin: true,
      body: { ats: "greenhouse", ids: [] },
    },
  ),
  formErrStep(
    "Company Error: Empty Body",
    "company",
    "id field is invalid: Invalid input: expected string, received undefined",
    {
      method: "DELETE",
      asAdmin: true,
      body: {},
    },
  ),

  // Refresh Jobs
  formErrStep(
    "Refresh Error: Unknown Arg",
    "refresh/jobs",
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

  // Delete Job
  formErrStep(
    "Delete Job Error: Missing Body",
    "job",
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
