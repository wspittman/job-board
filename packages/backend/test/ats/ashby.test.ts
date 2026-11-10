import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Ashby } from "../../src/ats/ashby.ts";
import type { CompanyResult } from "../../src/ats/ashby/companyResult.ts";
import type { JobResult } from "../../src/ats/ashby/jobResult.ts";
import { AppError } from "../../src/utils/AppError.ts";
import { mockFetch } from "../setup.ts";
import { makeJob } from "./ashbyHelpers.ts";
import { getFetchCall, jsonResponse } from "./atsHelpers.ts";

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

    const result = await new Ashby().getJobsETag({ id: "acme", ats: "ashby" });

    assert.equal(result.stable, false);
    assert.equal(result.data[0]?.item.id, "job-1");
    assert.equal("etag" in result, false);

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
