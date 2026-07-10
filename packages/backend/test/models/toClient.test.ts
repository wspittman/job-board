import assert from "node:assert/strict";
import { suite, test } from "node:test";

import type { Job } from "../../src/models/models.ts";
import { toClientJob, toClientJobs } from "../../src/models/toClient.ts";
import { mockDBContent } from "../setup.ts";

const buildJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job id",
  companyId: "acme/1",
  title: "Senior Engineer",
  description: "Build features.",
  postTS: 1_723_456_789,
  applyUrl: "https://example.com/apply",
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
  companyStage: "series_a",
  ...overrides,
});

suite("toClient", () => {
  async function mockQuickRef(companyQuickRef: string[][]) {
    await mockDBContent({ metadata: [{ id: "company", companyQuickRef }] });
  }

  test("toClientJob: maps job fields and normalizes output", async () => {
    const job = buildJob();
    await mockQuickRef([["acme/1", "Acme", "https://acme.example"]]);

    assert.deepEqual(await toClientJob(job), {
      id: "job id",
      companyId: "acme/1",
      title: "Senior Engineer",
      company: "Acme",
      companyWebsite: "https://acme.example/",
      workTimeBasis: "full_time",
      jobFamily: "engineering",
      companyStage: "series_a",
      currency: "USD",
      minSalary: 120000,
      payCadence: "salary",
      description: "Build features.",
      postTS: 1_723_456_789,
      applyUrl: "/job/apply?id=job%20id&companyId=acme%2F1",
      isRemote: true,
      location: "Seattle, WA",
      facets: {
        summary: "Owns the core platform.",
        experience: 3,
      },
    });
  });

  test("toClientJob: falls back to company id when mapping is unavailable", async () => {
    const job = buildJob();

    await mockQuickRef([]);
    const result = await toClientJob(job);

    assert.equal(result.company, "acme/1");
    assert.equal("companyWebsite" in result, false);
  });

  test("toClientJob: drops undefined top-level fields", async () => {
    const job = buildJob({
      presence: "onsite",
      primaryLocation: undefined,
      salaryRange: undefined,
      requiredExperience: undefined,
      summary: undefined,
      companyStage: undefined,
    });

    const result = await toClientJob(job);

    assert.equal(result.isRemote, false);
    assert.equal(result.location, "");
    assert.equal("currency" in result, false);
    assert.equal("minSalary" in result, false);
    assert.equal("payCadence" in result, false);
    assert.equal("companyStage" in result, false);
    assert.deepEqual(result.facets, {
      summary: undefined,
      experience: undefined,
    });
  });

  const companyWebsiteCases = [
    { input: "https://example.com", expected: "https://example.com/" },
    { input: "example.com", expected: "https://example.com/" },
    { input: "http://example.com", expected: undefined },
    { input: "  https://example.com  ", expected: "https://example.com/" },
    { input: "not-a-url", expected: undefined },
    { input: "", expected: undefined },
    { input: undefined, expected: undefined },
    { input: "ftp://example.com", expected: undefined },
  ];

  companyWebsiteCases.forEach(({ input, expected }) => {
    test(`toClientJob: handles company website format ${String(input)}`, async () => {
      const job = buildJob();

      await mockQuickRef([["acme/1", "Acme", input as string]]);
      const result = await toClientJob(job);
      if (expected === undefined) {
        assert.equal("companyWebsite" in result, false);
      } else {
        assert.equal(result.companyWebsite, expected);
      }
    });
  });

  test("toClientJobs: maps arrays of jobs", async () => {
    const jobs = [buildJob(), buildJob({ id: "job-2", companyId: "acme/2" })];

    await mockQuickRef([
      ["acme/1", "Acme", "https://acme.example"],
      ["acme/2", "Acme 2", "https://acme2.example"],
    ]);

    const results = await toClientJobs(jobs);

    assert.equal(results.length, 2);
    assert.equal(
      results[1]?.applyUrl,
      "/job/apply?id=job-2&companyId=acme%2F2",
    );
    assert.equal(results[1]?.company, "Acme 2");
    assert.equal(results[1]?.companyWebsite, "https://acme2.example/");
  });
});
