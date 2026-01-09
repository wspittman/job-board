import assert from "node:assert/strict";
import { suite, test } from "node:test";

import { toClientJob, toClientJobs } from "../../src/models/toClient.ts";
import type { Job } from "../../src/models/models.ts";

const buildJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job id",
  companyId: "acme/1",
  title: "Senior Engineer",
  description: "Build features.",
  postTS: 1_723_456_789,
  applyUrl: "https://example.com/apply",
  companyName: "Acme",
  presence: "remote",
  primaryLocation: {
    city: "Seattle",
    regionCode: "WA",
    countryCode: "US",
  },
  salaryRange: {
    currency: "USD",
    cadence: "salary",
    min: 120000,
    max: 150000,
    minOTE: 0,
    maxOTE: 0,
  },
  requiredExperience: 3,
  summary: "Owns the core platform.",
  workTimeBasis: "full_time",
  jobFamily: "engineering",
  ...overrides,
});

suite("toClientJob", () => {
  test("maps job fields and normalizes output", () => {
    const job = buildJob();

    assert.deepEqual(toClientJob(job), {
      id: "job id",
      companyId: "acme/1",
      title: "Senior Engineer",
      company: "Acme",
      workTimeBasis: "full_time",
      jobFamily: "engineering",
      currency: "USD",
      minSalary: 120000,
      payCadence: "salary",
      description: "Build features.",
      postTS: 1_723_456_789,
      applyUrl: "/job/apply?id=job%20id&companyId=acme%2F1",
      isRemote: true,
      location: "Seattle, WA, United States (US)",
      facets: {
        summary: "Owns the core platform.",
        experience: 3,
      },
    });
  });

  test("drops undefined top-level fields", () => {
    const job = buildJob({
      presence: "onsite",
      primaryLocation: undefined,
      salaryRange: undefined,
      requiredExperience: undefined,
      summary: undefined,
    });

    const result = toClientJob(job);

    assert.equal(result.isRemote, false);
    assert.equal(result.location, "");
    assert.equal("currency" in result, false);
    assert.equal("minSalary" in result, false);
    assert.equal("payCadence" in result, false);
    assert.deepEqual(result.facets, {
      summary: undefined,
      experience: undefined,
    });
  });
});

suite("toClientJobs", () => {
  test("maps arrays of jobs", () => {
    const jobs = [buildJob(), buildJob({ id: "job-2", companyId: "acme 2" })];

    const results = toClientJobs(jobs);

    assert.equal(results.length, 2);
    assert.equal(
      results[1]?.applyUrl,
      "/job/apply?id=job-2&companyId=acme%202",
    );
  });
});
