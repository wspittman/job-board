import type { HttpMethod } from "../types.ts";

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

const errBody = (message: string, statusCode = 400) => ({
  status: "error",
  statusCode,
  message,
});
