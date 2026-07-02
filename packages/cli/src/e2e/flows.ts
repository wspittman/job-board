import { atsTypes } from "../portal/atsConsts.ts";
import {
  type Step,
  allAddAts,
  allDelAts,
  ats,
  companyId,
  companyIds,
  formStep,
  oneAddEachAts,
  req,
  res,
} from "./step.ts";

const unknown = "unknown_id";
const UNDEFINED_ID =
  "id field is invalid: Invalid input: expected string, received undefined";

const pings: Step[] = [
  formStep("Ping", req.get(""), res.ok({ status: "success" })),
  formStep("404", req.get("unknown"), res(404, "Not Found")),
  formStep("Empty query", req.get("jobs"), res.ok([])),
  formStep("Metadata", req.get("metadata"), res.ok({})),
  formStep("Beacon", req.post("beacon"), res(204)),
];

const refreshJobsErrors: Step[] = [
  formStep(
    "Auth Missing",
    req.post("refresh/jobs", { asAdmin: false }),
    res.err("Unauthorized", 401),
  ),
  formStep(
    "Unknown Argument",
    req.post("refresh/jobs", { body: { ats, companyIds, unknown } }),
    res.err('Unrecognized key: "unknown"'),
  ),
  formStep(
    "Missing ATS",
    req.post("refresh/jobs", { body: { companyIds } }),
    res.err("ats field is required when using companyIds"),
  ),
  formStep(
    "Unknown ATS",
    req.post("refresh/jobs", { body: { ats: unknown, companyIds } }),
    res.err(
      `ats field is invalid: Invalid option: expected one of ${atsTypes.map((type) => `"${type}"`).join("|")}`,
    ),
  ),
];

const companyErrors: Step[] = [
  formStep(
    "Empty Body Error",
    req.put("company", { asAdmin: false, body: {} }),
    res.err(UNDEFINED_ID),
  ),
  formStep(
    "Empty Body Error",
    req.put("companies", { body: {} }),
    res.err(
      "ids field is invalid: Invalid input: expected array, received undefined",
    ),
  ),
  formStep(
    "Empty IDs Error",
    req.put("companies", { body: { ats: "greenhouse", ids: [] } }),
    res.err(
      "ids field is invalid: Too small: expected array to have >=1 items",
    ),
  ),
  formStep(
    "Empty Body Error",
    req.del("company", { body: {} }),
    res.err(UNDEFINED_ID),
  ),
];

const jobErrors: Step[] = [
  formStep("Missing Query Error", req.get("job/apply"), res.err(UNDEFINED_ID)),
  formStep(
    "Not Found Error",
    req.get("job/apply", {
      query: {
        id: unknown,
        companyId: unknown,
      },
    }),
    res.err("Job not found", 404),
  ),
  formStep(
    "Empty Body Error",
    req.del("company/job", { body: {} }),
    res.err(
      "companyId field is invalid: Invalid input: expected string, received undefined",
    ),
  ),
];

const allErrors: Step[] = [
  ...refreshJobsErrors,
  ...companyErrors,
  ...jobErrors,
];

const unknowns: Step[] = [
  formStep(
    "Unknown Company",
    req.post("refresh/jobs", { body: { ats, companyIds: [unknown] } }),
    res.accepted,
    "Verify internal Not Found exception",
  ),
  formStep(
    "Unknown Company",
    req.put("company", { asAdmin: false, body: { ats, id: unknown } }),
    res.err(`greenhouse / ${unknown}: Not Found`, 404),
  ),
  formStep(
    "Unknown Companies",
    req.put("companies", {
      body: {
        ats: "greenhouse",
        ids: [unknown, unknown + "2", unknown + "3"],
      },
    }),
    res.ok(),
    "Verify internal Not Found exceptions",
  ),
  formStep(
    "Unknown Company",
    req.del("company", { body: { ats, id: unknown } }),
    res.ok(),
  ),
  formStep(
    "Unknown Company",
    req.del("company/job", {
      body: { ats, companyId: unknown, jobId: unknown },
    }),
    res.ok(),
  ),
  formStep(
    "Unknown Job",
    req.del("company/job", { body: { ats, companyId, jobId: unknown } }),
    res.ok(),
  ),
];

const companies: Step[] = [
  ...allDelAts,
  ...oneAddEachAts,
  // Re-add the same companies to test idempotency
  ...oneAddEachAts,
  ...allAddAts,

  formStep(
    "Refresh All Companies",
    req.post("refresh/companies"),
    res.accepted,
    "Verify Company Refreshes",
  ),
];

const jobsBaseBody = { ats, companyIds: [companyId] };
const jobsLongAgo = new Date(2026, 0, 1).getTime();
const jobs: Step[] = [
  formStep(
    "Specific Company",
    req.post("refresh/jobs", { body: jobsBaseBody }),
    res.accepted,
    `Verify jobs refreshed for ${ats}/${companyId}`,
  ),
  formStep(
    "Specific Company",
    req.post("refresh/jobs", { body: jobsBaseBody }),
    res.accepted,
    `Verify jobs refreshed for ${ats}/${companyId} again (no new jobs)`,
  ),
  formStep(
    "Specific Company",
    req.post("refresh/jobs", {
      body: { ...jobsBaseBody, replaceJobsOlderThan: jobsLongAgo },
    }),
    res.accepted,
    `Verify jobs refreshed for ${ats}/${companyId} (no new jobs)`,
  ),
  formStep(
    "Specific Company",
    req.post("refresh/jobs", {
      body: { ...jobsBaseBody, replaceJobsOlderThan: "now" },
    }),
    res.accepted,
    `Verify jobs refreshed for ${ats}/${companyId}`,
  ),
  formStep(
    "Full ATS",
    req.post("refresh/jobs", { body: { ats } }),
    res.accepted,
    `Verify jobs refreshed for ${ats}`,
  ),
  formStep(
    "Full Site",
    req.post("refresh/jobs"),
    res.accepted,
    `Verify jobs refreshed for full site`,
  ),
];

const manualAts = "ashby";
const manualCompanyId = "asdf";
const manual: Step[] = [
  /*formStep(
    `Add ${manualAts} company ${manualCompanyId}`,
    req.put("company", {
      asAdmin: false,
      body: { ats: manualAts, id: manualCompanyId },
    }),
    res.ok(),
  ),*/
  formStep(
    `Specific Company ${manualCompanyId}`,
    req.post("refresh/jobs", {
      body: { ats: manualAts, companyIds: [manualCompanyId] },
    }),
    res.accepted,
  ),
  /*formStep(
    `Delete ${manualAts} company ${manualCompanyId}`,
    req.del("company", { body: { ats: manualAts, id: manualCompanyId } }),
    res.ok(),
  ),*/
];

/*
To be added to a flow:
/refresh/jobs for specific ATS
/refresh/jobs
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
  refreshJobsErrors,
  companyErrors,
  validations: allErrors,
  unknowns,
  companies,
  jobs,
  smoke: [...pings, ...allErrors, ...unknowns, ...companies, ...jobs],
  manual,
};
