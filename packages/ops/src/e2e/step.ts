import { config } from "../config.ts";
import type { Ats, HttpMethod } from "../types.ts";

const { GREENHOUSE_IDS: ghIds, LEVER_IDS: lvIds } = config;
const SUCCESS_BODY = { status: "success" };

/**
 * Defines a single step in an end-to-end flow.
 */
export interface Step {
  name: string;

  // Request
  method: HttpMethod;
  path: string;
  asAdmin: boolean;
  query?: Record<string, string>;
  body?: unknown;

  // Expected Response
  expectStatus: number;
  expectBody?: unknown;

  // Wait on user input before proceeding
  asyncWait?: string;
}

export const formStep = (
  path: string,
  name: string,
  step: Partial<Step> = {},
): Step => ({
  name,
  path,
  method: "GET",
  asAdmin: false,
  expectStatus: 200,
  ...step,
});

export const formSucStep = (
  path: string,
  name: string,
  step: Partial<Step> = {},
): Step => formStep(path, name, { expectBody: SUCCESS_BODY, ...step });

export const formAsyncStep = (
  path: string,
  name: string,
  step: Partial<Step> = {},
): Step =>
  formStep(path, name, {
    method: "POST",
    asAdmin: true,
    expectStatus: 202,
    expectBody: "Accepted",
    asyncWait: "Verify Async Action",
    ...step,
  });

export const formErrStep = (
  path: string,
  name: string,
  message: string,
  step: Partial<Step> = {},
): Step =>
  formStep(path, name, {
    expectStatus: 400,
    expectBody: errBody(message, step.expectStatus),
    ...step,
  });

export const delCompanyStep = (ats: Ats, id: string): Step =>
  companySucStep("DELETE", ats, id);

export const addCompanyStep = (ats: Ats, id: string): Step =>
  companySucStep("PUT", ats, id);

export const addCompaniesStep = (
  ats: Ats,
  ids: string[],
  asyncWait?: string,
): Step =>
  formSucStep("companies", `${ats} / [${ids.join(", ")}]`, {
    method: "PUT",
    asAdmin: true,
    body: { ats, ids },
    asyncWait,
  });

export const resetSteps: Step[] = [
  ...ghIds.map((x) => delCompanyStep("greenhouse", x)),
  ...lvIds.map((x) => delCompanyStep("lever", x)),
];
resetSteps.at(-1)!.asyncWait = "Verify companies deleted and metadata reset";

function companySucStep(method: HttpMethod, ats: Ats, id: string): Step {
  return formSucStep(`company`, `${ats} / ${id}`, {
    method,
    asAdmin: true,
    body: { ats, id },
  });
}

function errBody(message: string, statusCode = 400) {
  return {
    status: "error",
    statusCode,
    message,
  };
}
