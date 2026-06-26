import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  formatCompany,
  formatJob,
  formatJobs,
  type JobResult,
} from "../../src/ats/leverFormat.ts";

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

suite("leverFormat", () => {
  test("formats a company from its board id", () => {
    assert.deepEqual(formatCompany("acme"), {
      id: "acme",
      ats: "lever",
      name: "Acme",
    });
  });

  test("assembles, sanitizes, and formats a job", () => {
    const job = makeJob();

    assert.deepEqual(formatJob("acme", job), {
      item: {
        id: "job-1",
        companyId: "acme",
        title: "Software Engineer",
        description:
          "<p>Opening</p>\n<p>Responsibilities</p>\n<ul>\n<li>Build</li>\n</ul>\n<p>$100k</p>\n<p>More</p>",
        postTS: Date.parse("2026-03-04T05:06:07.000Z"),
        applyUrl: "https://jobs.example.com/job-1/apply",
      },
      context: [
        {
          description: "Additional information about the job job-1",
          content: {
            categories: job.categories,
            country: "US",
            workplaceType: "remote",
            salaryRange: job.salaryRange,
            location: "remote: [Seattle; Remote]",
          },
        },
      ],
    });
  });

  test("uses empty optional sections and formats job collections", () => {
    const job = makeJob({
      salaryDescription: undefined,
      salaryRange: undefined,
      lists: undefined,
    });
    const expected = formatJob("acme", job);

    assert.equal(expected.item.description, "<p>Opening</p>\n<p>More</p>");
    assert.deepEqual(expected.context?.[0]?.content["salaryRange"], undefined);
    assert.deepEqual(formatJobs("acme", [job]), [expected]);
  });
});
