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
  body?: unknown;

  // Expected Response
  expectStatus: number;
  expectBody?: unknown;
}

export const formStep = (
  name: string,
  path: string,
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
  name: string,
  path: string,
  step: Partial<Step> = {},
): Step => formStep(name, path, { expectBody: SUCCESS_BODY, ...step });

export const formErrStep = (
  name: string,
  path: string,
  message: string,
  step: Partial<Step> = {},
): Step =>
  formStep(name, path, {
    expectStatus: 400,
    expectBody: errBody(message, step.expectStatus),
    ...step,
  });

const errBody = (message: string, statusCode = 400) => ({
  status: "error",
  statusCode,
  message,
});
