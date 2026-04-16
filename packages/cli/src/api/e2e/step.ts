import { config } from "../config.ts";
import type { HttpMethod } from "../client.ts";

const { GREENHOUSE_IDS: ghIds, LEVER_IDS: lvIds } = config;
const SUCCESS_BODY = { status: "success" };

export interface Step {
  name: string;
  method: HttpMethod;
  path: string;
  asAdmin: boolean;
  query?: Record<string, string>;
  body?: unknown;
  expectStatus: number;
  expectBody?: unknown;
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
    asyncWait: "Verify async action",
    ...step,
  });

export const resetSteps: Step[] = [
  ...ghIds.map((id) =>
    formSucStep("company", `greenhouse / ${id}`, {
      method: "DELETE",
      asAdmin: true,
      body: { ats: "greenhouse", id },
    }),
  ),
  ...lvIds.map((id) =>
    formSucStep("company", `lever / ${id}`, {
      method: "DELETE",
      asAdmin: true,
      body: { ats: "lever", id },
    }),
  ),
];

function errBody(message: string, statusCode = 400) {
  return {
    status: "error",
    statusCode,
    message,
  };
}
