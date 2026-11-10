import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  formatCompany,
  formatJob,
  formatJobBasic,
  formatJobs,
  formatJobsBasic,
} from "../../src/ats/greenhouseFormat.ts";
import { makeJob, makeJobBasic } from "./greenhouseHelpers.ts";

suite("greenhouseFormat", () => {
  test("formats and sanitizes a company", () => {
    assert.deepEqual(
      formatCompany("acme", {
        name: " Acme Inc. ",
        content: "<p>Great workplace.</p><script>bad()</script>",
      }),
      {
        id: "acme",
        ats: "greenhouse",
        name: "Acme Inc.",
        description: "<p>Great workplace.</p>",
      },
    );
  });

  test("formats basic job metadata without context", () => {
    assert.deepEqual(formatJobBasic("acme", makeJobBasic()), {
      item: {
        id: "42",
        companyId: "acme",
        title: "Software Engineer",
        description: "",
        postTS: Date.parse("2026-02-03T04:05:06.000Z"),
        applyUrl: "https://boards.example.com/jobs/42",
      },
    });
  });

  test("formats and sanitizes a full job with Greenhouse context", () => {
    const job = makeJob({
      content: "<p>Build <strong>things</strong>.</p>",
    });

    assert.deepEqual(formatJob("acme", job), {
      item: {
        id: "42",
        companyId: "acme",
        title: "Software Engineer",
        description: "<p>Build <strong>things</strong>.</p>",
        postTS: Date.parse("2026-02-03T04:05:06.000Z"),
        applyUrl: "https://boards.example.com/jobs/42",
      },
      context: [
        {
          description: "Additional information about the job 42",
          content: {
            metadata: { level: "senior" },
            departments: job.departments,
            offices: job.offices,
            location: "Seattle, WA",
          },
        },
      ],
    });
  });

  test("formats basic and full job collections", () => {
    const basicJob = makeJobBasic();
    const fullJob = makeJob();

    assert.deepEqual(
      formatJobsBasic("acme", { jobs: [basicJob], meta: { total: 1 } }),
      [formatJobBasic("acme", basicJob)],
    );
    assert.deepEqual(
      formatJobs("acme", { jobs: [fullJob], meta: { total: 1 } }),
      [formatJob("acme", fullJob)],
    );
  });
});
