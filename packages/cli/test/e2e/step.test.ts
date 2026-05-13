import assert from "node:assert/strict";
import { after, suite, test } from "node:test";

const originalAdminToken = process.env.ADMIN_TOKEN;
const originalGreenhouseIds = process.env.GREENHOUSE_IDS;
const originalLeverIds = process.env.LEVER_IDS;

process.env.ADMIN_TOKEN = "test-admin-token-1";
process.env.GREENHOUSE_IDS = "gh-1, gh-2";
process.env.LEVER_IDS = "lv-1";

const {
  req,
  res,
  formStep,
  ats,
  companyId,
  companyIds,
  oneAddEachAts,
  allAddAts,
  allDelAts,
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

  test("req: builds request with method, path, asAdmin, and opts", () => {
    assert.deepEqual(req("GET", "jobs", {}, false), {
      method: "GET",
      path: "jobs",
      asAdmin: false,
    });

    assert.deepEqual(
      req("POST", "company", { body: { ats: "lever", id: "lv-1" } }, true),
      {
        method: "POST",
        path: "company",
        asAdmin: true,
        body: { ats: "lever", id: "lv-1" },
      },
    );
  });

  test("req shorthands: get is not admin, post/put/del default to admin", () => {
    assert.deepEqual(req.get("jobs"), {
      method: "GET",
      path: "jobs",
      asAdmin: false,
    });

    assert.deepEqual(req.post("jobs"), {
      method: "POST",
      path: "jobs",
      asAdmin: true,
    });

    assert.deepEqual(req.put("company", { body: { ats: "ashby", id: "x" } }), {
      method: "PUT",
      path: "company",
      asAdmin: true,
      body: { ats: "ashby", id: "x" },
    });

    assert.deepEqual(
      req.del("company", { body: { ats: "lever", id: "lv-1" } }),
      {
        method: "DELETE",
        path: "company",
        asAdmin: true,
        body: { ats: "lever", id: "lv-1" },
      },
    );
  });

  test("req shorthands: opts can override the default asAdmin", () => {
    assert.deepEqual(
      req.put("company", {
        asAdmin: false,
        body: { ats: "greenhouse", id: "gh-1" },
      }),
      {
        method: "PUT",
        path: "company",
        asAdmin: false,
        body: { ats: "greenhouse", id: "gh-1" },
      },
    );
  });

  test("res: builds response with status and optional value", () => {
    assert.deepEqual(res(200), { status: 200, value: undefined });
    assert.deepEqual(res(201, "created"), { status: 201, value: "created" });
  });

  test("res.ok: returns 200 with optional value", () => {
    assert.deepEqual(res.ok(), { status: 200, value: undefined });
    assert.deepEqual(res.ok({ count: 3 }), {
      status: 200,
      value: { count: 3 },
    });
  });

  test("res.err: defaults to 400 and builds error payload", () => {
    assert.deepEqual(res.err("Bad request"), {
      status: 400,
      value: { status: "error", statusCode: 400, message: "Bad request" },
    });

    assert.deepEqual(res.err("Not Found", 404), {
      status: 404,
      value: { status: "error", statusCode: 404, message: "Not Found" },
    });
  });

  test("res.accepted: is a 202 Accepted response", () => {
    assert.deepEqual(res.accepted, { status: 202, value: "Accepted" });
  });

  test("formStep: builds a step with name, req, res, and optional confirm", () => {
    assert.deepEqual(formStep("list jobs", req.get("jobs"), res.ok()), {
      name: "list jobs",
      req: { method: "GET", path: "jobs", asAdmin: false },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });

    assert.deepEqual(
      formStep("sync jobs", req.post("jobs/sync"), res.accepted, "Verify sync"),
      {
        name: "sync jobs",
        req: { method: "POST", path: "jobs/sync", asAdmin: true },
        res: { status: 202, value: "Accepted" },
        confirm: "Verify sync",
      },
    );
  });

  test("constants: ats, companyId, companyIds reflect configured greenhouse ids", () => {
    assert.equal(ats, "greenhouse");
    assert.equal(companyId, "gh-1");
    assert.deepEqual(companyIds, ["gh-1", "gh-2"]);
  });

  test("oneAddEachAts: one add step per ATS type using first id", () => {
    assert.equal(oneAddEachAts.length, 3);

    assert.deepEqual(oneAddEachAts[0], {
      name: "Add ashby company",
      req: {
        method: "PUT",
        path: "company",
        asAdmin: false,
        body: { ats: "ashby", id: "stream" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });

    assert.deepEqual(oneAddEachAts[1], {
      name: "Add greenhouse company",
      req: {
        method: "PUT",
        path: "company",
        asAdmin: false,
        body: { ats: "greenhouse", id: "gh-1" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });

    assert.deepEqual(oneAddEachAts[2], {
      name: "Add lever company",
      req: {
        method: "PUT",
        path: "company",
        asAdmin: false,
        body: { ats: "lever", id: "lv-1" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });
  });

  test("allAddAts: add-all steps per ATS type with confirm messages", () => {
    assert.equal(allAddAts.length, 3);

    assert.deepEqual(allAddAts[0], {
      name: "Add all ashby companies",
      req: {
        method: "PUT",
        path: "companies",
        asAdmin: true,
        body: { ats: "ashby", ids: ["stream"] },
      },
      res: { status: 200, value: undefined },
      confirm: "Verify ashby companies added",
    });

    assert.deepEqual(allAddAts[1], {
      name: "Add all greenhouse companies",
      req: {
        method: "PUT",
        path: "companies",
        asAdmin: true,
        body: { ats: "greenhouse", ids: ["gh-1", "gh-2"] },
      },
      res: { status: 200, value: undefined },
      confirm: "Verify greenhouse companies added",
    });

    assert.deepEqual(allAddAts[2], {
      name: "Add all lever companies",
      req: {
        method: "PUT",
        path: "companies",
        asAdmin: true,
        body: { ats: "lever", ids: ["lv-1"] },
      },
      res: { status: 200, value: undefined },
      confirm: "Verify lever companies added",
    });
  });

  test("allDelAts: delete step for every configured company id", () => {
    // ashby: ["stream"], greenhouse: ["gh-1", "gh-2"], lever: ["lv-1"]
    assert.equal(allDelAts.length, 4);

    assert.deepEqual(allDelAts[0], {
      name: "Delete ashby company stream",
      req: {
        method: "DELETE",
        path: "company",
        asAdmin: true,
        body: { ats: "ashby", id: "stream" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });

    assert.deepEqual(allDelAts[1], {
      name: "Delete greenhouse company gh-1",
      req: {
        method: "DELETE",
        path: "company",
        asAdmin: true,
        body: { ats: "greenhouse", id: "gh-1" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });

    assert.deepEqual(allDelAts[2], {
      name: "Delete greenhouse company gh-2",
      req: {
        method: "DELETE",
        path: "company",
        asAdmin: true,
        body: { ats: "greenhouse", id: "gh-2" },
      },
      res: { status: 200, value: undefined },
      confirm: undefined,
    });
  });

  test("allDelAts: last step has confirm set", () => {
    const last = allDelAts.at(-1);
    assert.deepEqual(last, {
      name: "Delete lever company lv-1",
      req: {
        method: "DELETE",
        path: "company",
        asAdmin: true,
        body: { ats: "lever", id: "lv-1" },
      },
      res: { status: 200, value: undefined },
      confirm: "Verify companies deleted",
    });
  });
});
