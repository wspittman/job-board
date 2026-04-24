import assert from "node:assert/strict";
import { after, suite, test } from "node:test";

const originalAdminToken = process.env.ADMIN_TOKEN;
const originalGreenhouseIds = process.env.GREENHOUSE_IDS;
const originalLeverIds = process.env.LEVER_IDS;

process.env.ADMIN_TOKEN = "test-admin-token-1";
process.env.GREENHOUSE_IDS = "gh-1, gh-2";
process.env.LEVER_IDS = "lv-1";

const {
  addCompaniesStep,
  addCompanyStep,
  delCompanyStep,
  formAsyncStep,
  formErrStep,
  formStep,
  formSucStep,
  resetSteps,
} = await import("../../src/e2e/step.ts");

suite("e2e step", () => {
  after(() => {
    if (originalAdminToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalAdminToken;
    }

    if (originalGreenhouseIds === undefined) {
      delete process.env.GREENHOUSE_IDS;
    } else {
      process.env.GREENHOUSE_IDS = originalGreenhouseIds;
    }

    if (originalLeverIds === undefined) {
      delete process.env.LEVER_IDS;
    } else {
      process.env.LEVER_IDS = originalLeverIds;
    }
  });

  test("formStep: applies defaults and allows overrides", () => {
    assert.deepEqual(formStep("jobs", "list jobs"), {
      name: "list jobs",
      path: "jobs",
      method: "GET",
      asAdmin: false,
      expectStatus: 200,
    });

    assert.deepEqual(
      formStep("jobs", "create job", {
        method: "POST",
        asAdmin: true,
        expectStatus: 201,
      }),
      {
        name: "create job",
        path: "jobs",
        method: "POST",
        asAdmin: true,
        expectStatus: 201,
      },
    );
  });

  test("formSucStep: defaults to success body and supports overrides", () => {
    assert.deepEqual(formSucStep("jobs", "sync jobs"), {
      name: "sync jobs",
      path: "jobs",
      method: "GET",
      asAdmin: false,
      expectStatus: 200,
      expectBody: { status: "success" },
    });

    assert.deepEqual(
      formSucStep("jobs", "sync jobs", {
        expectBody: { status: "custom" },
      }),
      {
        name: "sync jobs",
        path: "jobs",
        method: "GET",
        asAdmin: false,
        expectStatus: 200,
        expectBody: { status: "custom" },
      },
    );
  });

  test("formAsyncStep: applies async defaults and keeps explicit overrides", () => {
    assert.deepEqual(formAsyncStep("jobs/sync", "sync now"), {
      name: "sync now",
      path: "jobs/sync",
      method: "POST",
      asAdmin: true,
      expectStatus: 202,
      expectBody: "Accepted",
      asyncWait: "Verify Async Action",
    });

    assert.deepEqual(
      formAsyncStep("jobs/sync", "sync now", {
        expectStatus: 204,
        asyncWait: "Custom async check",
      }),
      {
        name: "sync now",
        path: "jobs/sync",
        method: "POST",
        asAdmin: true,
        expectStatus: 204,
        expectBody: "Accepted",
        asyncWait: "Custom async check",
      },
    );
  });

  test("formErrStep: defaults to 400 error payload and honors custom status", () => {
    assert.deepEqual(formErrStep("jobs", "invalid job", "Bad request"), {
      name: "invalid job",
      path: "jobs",
      method: "GET",
      asAdmin: false,
      expectStatus: 400,
      expectBody: {
        status: "error",
        statusCode: 400,
        message: "Bad request",
      },
    });

    assert.deepEqual(
      formErrStep("jobs", "missing", "Not Found", {
        expectStatus: 404,
      }),
      {
        name: "missing",
        path: "jobs",
        method: "GET",
        asAdmin: false,
        expectStatus: 404,
        expectBody: {
          status: "error",
          statusCode: 404,
          message: "Not Found",
        },
      },
    );
  });

  test("company step helpers: build admin company requests", () => {
    assert.deepEqual(addCompanyStep("greenhouse", "gh-1"), {
      name: "greenhouse / gh-1",
      path: "company",
      method: "PUT",
      asAdmin: true,
      expectStatus: 200,
      expectBody: { status: "success" },
      body: { ats: "greenhouse", id: "gh-1" },
    });

    assert.deepEqual(delCompanyStep("lever", "lv-2"), {
      name: "lever / lv-2",
      path: "company",
      method: "DELETE",
      asAdmin: true,
      expectStatus: 200,
      expectBody: { status: "success" },
      body: { ats: "lever", id: "lv-2" },
    });

    assert.deepEqual(addCompaniesStep("greenhouse", ["gh-1", "gh-2"]), {
      name: "greenhouse / [gh-1, gh-2]",
      path: "companies",
      method: "PUT",
      asAdmin: true,
      expectStatus: 200,
      expectBody: { status: "success" },
      body: { ats: "greenhouse", ids: ["gh-1", "gh-2"] },
      asyncWait: undefined,
    });
  });

  test("resetSteps: deletes configured ids and sets async wait on final step", () => {
    assert.deepEqual(resetSteps, [
      {
        name: "greenhouse / gh-1",
        path: "company",
        method: "DELETE",
        asAdmin: true,
        expectStatus: 200,
        expectBody: { status: "success" },
        body: { ats: "greenhouse", id: "gh-1" },
      },
      {
        name: "greenhouse / gh-2",
        path: "company",
        method: "DELETE",
        asAdmin: true,
        expectStatus: 200,
        expectBody: { status: "success" },
        body: { ats: "greenhouse", id: "gh-2" },
      },
      {
        name: "lever / lv-1",
        path: "company",
        method: "DELETE",
        asAdmin: true,
        expectStatus: 200,
        expectBody: { status: "success" },
        body: { ats: "lever", id: "lv-1" },
        asyncWait: "Verify companies deleted and metadata reset",
      },
    ]);
  });
});
