import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Lever } from "../../src/ats/lever.ts";
import type { JobResult } from "../../src/ats/leverFormat.ts";
import { AppError } from "../../src/utils/AppError.ts";
import { mockFetch } from "../setup.ts";

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function getFetchCall(fetchMock: ReturnType<typeof mockFetch>, index = 0) {
  const call = fetchMock.mock.calls[index];
  assert.ok(call);
  const [url, init] = call.arguments as [string, RequestInit];
  return { url, init };
}

function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    id: "job-1",
    createdAt: Date.parse("2026-03-04T05:06:07.000Z"),
    applyUrl: "https://jobs.example.com/job-1/apply",
    text: "SOFTWARE ENGINEER",
    description: "Opening",
    additional: "<p>More</p>",
    salaryDescription: "<p>$100k</p>",
    lists: [{ text: "Responsibilities", content: "<li>Build</li>" }],
    categories: {
      commitment: "Full-time",
      location: "Remote",
      team: "Platform",
      department: "Engineering",
      allLocations: ["Seattle", "Remote"],
    },
    country: "US",
    workplaceType: "remote",
    salaryRange: {
      currency: "USD",
      interval: "year",
      min: 100_000,
      max: 120_000,
    },
    ...overrides,
  };
}

suite("Lever", () => {
  test("getCompany validates the board and formats the company", async () => {
    const fetchMock = mockFetch(async () => jsonResponse([makeJob()]));

    assert.deepEqual(
      await new Lever().getCompany({ id: "acme", ats: "lever" }),
      {
        id: "acme",
        ats: "lever",
        name: "Acme",
      },
    );

    const { url, init } = getFetchCall(fetchMock);
    assert.equal(
      url,
      "https://api.lever.co/v0/postings/acme/?mode=json&limit=1",
    );
    assert.ok(init.signal instanceof AbortSignal);
  });

  test("getJobs fetches and formats the public postings route", async () => {
    const fetchMock = mockFetch(async () => jsonResponse([makeJob()]));

    const jobs = await new Lever().getJobs({ id: "acme", ats: "lever" });

    assert.equal(jobs[0]?.item.id, "job-1");
    assert.equal(jobs[0]?.item.title, "Software Engineer");
    assert.equal(jobs[0]?.item.description.includes("Responsibilities"), true);

    const { url } = getFetchCall(fetchMock);
    assert.equal(url, "https://api.lever.co/v0/postings/acme/?mode=json");
  });

  test("getJobsETag sends If-None-Match and returns stable on 304", async () => {
    const fetchMock = mockFetch(
      async () =>
        new Response(null, { status: 304, statusText: "Not Modified" }),
    );

    assert.deepEqual(
      await new Lever().getJobsETag({ id: "acme", ats: "lever" }, "etag-value"),
      { stable: true },
    );

    const { init } = getFetchCall(fetchMock);
    assert.equal(init.cache, "force-cache");
    assert.deepEqual(init.headers, { "If-None-Match": "etag-value" });
  });

  test("getExampleJob formats the first returned posting and handles empty boards", async () => {
    const lever = new Lever();

    mockFetch(async () => jsonResponse([makeJob()]));
    assert.equal(
      (await lever.getExampleJob({ id: "acme", ats: "lever" }))?.item.id,
      "job-1",
    );

    mockFetch(async () => jsonResponse([]));
    assert.equal(
      await lever.getExampleJob({ id: "acme", ats: "lever" }),
      undefined,
    );
  });

  test("getSpecificJob finds the requested posting and reports 404 when missing", async () => {
    const lever = new Lever();

    mockFetch(async () => jsonResponse([makeJob(), makeJob({ id: "job-2" })]));

    const job = await lever.getSpecificJob({ id: "job-2", companyId: "acme" });
    assert.equal(job.item.id, "job-2");

    mockFetch(async () => jsonResponse([makeJob()]));

    await assert.rejects(
      () => lever.getSpecificJob({ id: "missing", companyId: "acme" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 404 &&
        error.message === "Job not found",
    );
  });
});
