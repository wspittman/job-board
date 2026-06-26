import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  formatCompany,
  formatJob,
  formatJobBasic,
  formatJobs,
  formatJobsBasic,
  type JobResult,
  type JobResultBasic,
} from "../../src/ats/greenhouseFormat.ts";

function makeJobBasic(overrides: Partial<JobResultBasic> = {}): JobResultBasic {
  return {
    id: 42,
    internal_job_id: 7,
    title: "SOFTWARE ENGINEER",
    updated_at: "2026-02-03T04:05:06.000Z",
    requisition_id: "REQ-42",
    location: { name: "Seattle, WA" },
    absolute_url: "https://boards.example.com/jobs/42",
    metadata: { level: "senior" },
    ...overrides,
  };
}

function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    ...makeJobBasic(),
    content: "<p>Build <strong>things</strong>.</p><script>bad()</script>",
    departments: [
      { id: 1, name: "Engineering", child_ids: [], parent_id: undefined },
    ],
    offices: [
      {
        id: 2,
        name: "Seattle",
        location: "Seattle, WA",
        child_ids: [],
        parent_id: undefined,
      },
    ],
    ...overrides,
  };
}

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
    const job = makeJob();

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
