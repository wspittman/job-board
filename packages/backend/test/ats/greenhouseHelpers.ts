import { JobResult, JobResultBasic } from "../../src/ats/greenhouseFormat";

export function makeJobBasic(
  overrides: Partial<JobResultBasic> = {},
): JobResultBasic {
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

export function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    ...makeJobBasic(),
    content: "<p>Build</p>",
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
