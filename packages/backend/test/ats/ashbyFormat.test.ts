import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { formatCompany, formatJob } from "../../src/ats/ashbyFormat.ts";
import { makeJob } from "./ashbyHelpers.ts";

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
