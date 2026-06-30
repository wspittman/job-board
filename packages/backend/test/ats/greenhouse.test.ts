import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { Greenhouse } from "../../src/ats/greenhouse.ts";
import type {
  CompanyResult,
  JobResult,
  JobResultBasic,
} from "../../src/ats/greenhouseFormat.ts";
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

suite("Greenhouse", () => {
  test("getCompany fetches and formats a Greenhouse board", async () => {
    const result: CompanyResult = {
      name: " Acme Inc. ",
      content: "<p>About Acme</p>",
    };
    const fetchMock = mockFetch(async () => jsonResponse(result));

    assert.deepEqual(
      await new Greenhouse().getCompany({ id: "acme", ats: "greenhouse" }),
      {
        id: "acme",
        ats: "greenhouse",
        name: "Acme Inc.",
        description: "<p>About Acme</p>",
      },
    );

    const { url, init } = getFetchCall(fetchMock);
    assert.equal(url, "https://boards-api.greenhouse.io/v1/boards/acme/");
    assert.ok(init.signal instanceof AbortSignal);
  });

  [
    {
      name: "full jobs by default",
      meta: undefined,
      body: { jobs: [makeJob()], meta: { total: 1 } },
      expectedUrl:
        "https://boards-api.greenhouse.io/v1/boards/acme//jobs?content=true",
      expectedDescription: "<p>Build</p>",
      expectedContext: true,
    },
    {
      name: "metadata jobs when requested",
      meta: true,
      body: { jobs: [makeJobBasic()], meta: { total: 1 } },
      expectedUrl: "https://boards-api.greenhouse.io/v1/boards/acme//jobs",
      expectedDescription: "",
      expectedContext: false,
    },
  ].forEach(
    ({
      name,
      meta,
      body,
      expectedUrl,
      expectedDescription,
      expectedContext,
    }) => {
      test(`getJobs fetches ${name}`, async () => {
        const fetchMock = mockFetch(async () => jsonResponse(body));

        const jobs = await new Greenhouse().getJobs(
          { id: "acme", ats: "greenhouse" },
          meta,
        );

        assert.equal(jobs[0]?.item.id, "42");
        assert.equal(jobs[0]?.item.title, "Software Engineer");
        assert.equal(jobs[0]?.item.description, expectedDescription);
        assert.equal(!!jobs[0]?.context, expectedContext);

        const { url } = getFetchCall(fetchMock);
        assert.equal(url, expectedUrl);
      });
    },
  );

  test("getJobsETag sends If-None-Match and returns stable on 304", async () => {
    const fetchMock = mockFetch(
      async () =>
        new Response(null, { status: 304, statusText: "Not Modified" }),
    );

    assert.deepEqual(
      await new Greenhouse().getJobsETag(
        { id: "acme", ats: "greenhouse" },
        "etag-value",
      ),
      { stable: true },
    );

    const { url, init } = getFetchCall(fetchMock);
    assert.equal(
      url,
      "https://boards-api.greenhouse.io/v1/boards/acme//jobs?content=true",
    );
    assert.equal(init.cache, "force-cache");
    assert.deepEqual(init.headers, { "If-None-Match": "etag-value" });
  });

  test("getExampleJob fetches metadata first, then the full selected job", async () => {
    const fetchMock = mockFetch(async (url) => {
      if (String(url).endsWith("//jobs")) {
        return jsonResponse({
          jobs: [makeJobBasic()],
          meta: { total: 1 },
        });
      }

      return jsonResponse(makeJob());
    });

    const job = await new Greenhouse().getExampleJob({
      id: "acme",
      ats: "greenhouse",
    });

    assert.equal(job?.item.id, "42");
    assert.equal(job?.item.description, "<p>Build</p>");
    assert.equal(fetchMock.mock.callCount(), 2);
    assert.equal(
      getFetchCall(fetchMock, 1).url,
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs/42",
    );
  });
});
