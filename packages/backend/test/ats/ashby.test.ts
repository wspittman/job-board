import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Ashby } from "../../src/ats/ashby.ts";
import type { CompanyResult } from "../../src/ats/ashby/companyResult.ts";
import type { JobResult } from "../../src/ats/ashby/jobResult.ts";
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
    title: "SOFTWARE ENGINEER",
    department: "Engineering",
    team: "Platform",
    employmentType: "FullTime",
    location: "Remote",
    secondaryLocations: ["Seattle"],
    publishedAt: "2026-01-02T03:04:05.000Z",
    isListed: true,
    isRemote: true,
    workplaceType: "Remote",
    address: {
      postalAddress: {
        addressRegion: "WA",
        addressCountry: "US",
        addressLocality: "Seattle",
      },
    },
    jobUrl: "https://jobs.example.com/job-1",
    applyUrl: "https://jobs.example.com/job-1/apply",
    descriptionHtml: "<p>Build</p>",
    descriptionPlain: "Build",
    compensation: {
      compensationTierSummary: "$100k-$120k",
      scrapeableCompensationSalarySummary: "$100k-$120k",
      compensationTiers: [],
      summaryComponents: [],
    },
    ...overrides,
  };
}

function makeCompanyResult(jobs: JobResult[] = [makeJob()]): CompanyResult {
  return { apiVersion: "1", jobs };
}

suite("Ashby", () => {
  test("getCompany validates the board and formats the company", async () => {
    const fetchMock = mockFetch(async () => jsonResponse(makeCompanyResult()));

    assert.deepEqual(
      await new Ashby().getCompany({ id: "acme", ats: "ashby" }),
      {
        id: "acme",
        ats: "ashby",
        name: "Acme",
      },
    );

    const { url, init } = getFetchCall(fetchMock);
    assert.equal(url, "https://api.ashbyhq.com/posting-api/job-board/acme/");
    assert.ok(init.signal instanceof AbortSignal);
  });

  test("getJobs fetches the compensation-inclusive board route", async () => {
    const fetchMock = mockFetch(async () => jsonResponse(makeCompanyResult()));

    const jobs = await new Ashby().getJobs({ id: "acme", ats: "ashby" });

    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.item.id, "job-1");
    assert.equal(jobs[0]?.item.title, "Software Engineer");
    assert.deepEqual(
      jobs[0]?.context?.[0]?.content["compensation"],
      makeJob().compensation,
    );

    const { url } = getFetchCall(fetchMock);
    assert.equal(
      url,
      "https://api.ashbyhq.com/posting-api/job-board/acme/?includeCompensation=true",
    );
  });

  test("getJobsETag returns unstable formatted data because Ashby has no ETag support", async () => {
    const fetchMock = mockFetch(async () => jsonResponse(makeCompanyResult()));

    const result = await new Ashby().getJobsETag(
      { id: "acme", ats: "ashby" },
      "etag-value",
    );

    assert.equal(result.stable, false);
    assert.equal(result.data[0]?.item.id, "job-1");
    assert.equal(result.etag, undefined);

    const { init } = getFetchCall(fetchMock);
    assert.equal(init.headers, undefined);
    assert.equal(init.cache, undefined);
  });

  test("getSpecificJob finds the requested job and reports 404 when missing", async () => {
    const ats = new Ashby();

    mockFetch(async () =>
      jsonResponse(makeCompanyResult([makeJob(), makeJob({ id: "job-2" })])),
    );

    const job = await ats.getSpecificJob({ id: "job-2", companyId: "acme" });
    assert.equal(job.item.id, "job-2");

    mockFetch(async () => jsonResponse(makeCompanyResult([makeJob()])));

    await assert.rejects(
      () => ats.getSpecificJob({ id: "missing", companyId: "acme" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 404 &&
        error.message === "Job not found",
    );
  });
});
