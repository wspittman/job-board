import assert from "node:assert/strict";
import { suite, test } from "node:test";
import type { JobResult } from "../../src/ats/ashby/jobResult.ts";
import { formatCompany, formatJob } from "../../src/ats/ashbyFormat.ts";

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
    descriptionHtml:
      "<p>Build <strong>things</strong>.</p><script>bad()</script>",
    descriptionPlain: "Build things.",
    compensation: {
      compensationTierSummary: "$100k-$120k",
      scrapeableCompensationSalarySummary: "$100k-$120k",
      compensationTiers: [],
      summaryComponents: [],
    },
    ...overrides,
  };
}

suite("ashbyFormat", () => {
  test("formats a company from its trimmed board id", () => {
    assert.deepEqual(formatCompany(" acme "), {
      id: "acme",
      ats: "ashby",
      name: "Acme",
    });
  });

  test("formats and sanitizes a job with Ashby context", () => {
    const job = makeJob();

    assert.deepEqual(formatJob("acme", job), {
      item: {
        id: "job-1",
        companyId: "acme",
        title: "Software Engineer",
        description: "<p>Build <strong>things</strong>.</p>",
        postTS: Date.parse("2026-01-02T03:04:05.000Z"),
        applyUrl: "https://jobs.example.com/job-1/apply",
      },
      context: [
        {
          description: "Additional information about the job job-1",
          content: {
            address: job.address,
            compensation: job.compensation,
            department: "Engineering",
            employmentType: "FullTime",
            secondaryLocations: ["Seattle"],
            team: "Platform",
            location: "Remote",
            workplaceType: "Remote",
          },
        },
      ],
    });
  });
});
