import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, suite, test } from "node:test";
import timers from "node:timers/promises";
import { fetchJobCounts } from "../../src/portal/pFuncs.ts";
import { afterReset, logBasePath, mockFetch } from "../setup.ts";

after(afterReset);

const updatedAt = new Date().toISOString();
const logFile = path.join(logBasePath, "test.log");

async function waitForLogText(
  expected: string,
  startPosition: number,
): Promise<string> {
  const start = Date.now();
  let text = "";

  while (Date.now() - start < 500) {
    text = (await readFile(logFile, "utf8").catch(() => "")).slice(
      startPosition,
    );

    if (text.includes(expected)) {
      return text;
    }

    await timers.setTimeout(10);
  }

  return text;
}

function jobsResponse(companyId: string) {
  return new Response(
    JSON.stringify({
      jobs: [
        {
          id: 101,
          internal_job_id: 1001,
          title: "SOFTWARE ENGINEER",
          updated_at: updatedAt,
          requisition_id: "REQ-1",
          location: { name: "Remote" },
          absolute_url: `https://boards.example/${companyId}/101`,
        },
        {
          id: 102,
          internal_job_id: 1002,
          title: "DESIGNER",
          updated_at: "2020-01-01T00:00:00.000Z",
          requisition_id: "REQ-2",
          location: { name: "Remote" },
          absolute_url: `https://boards.example/${companyId}/102`,
        },
      ],
      meta: { total: 2 },
    }),
    {
      headers: {
        "content-type": "application/json",
        etag: 'W/"portal-log-test"',
      },
    },
  );
}

suite("portal pFuncs", () => {
  test("fetchJobCounts writes backend ATS telemetry to the CLI log file", async () => {
    const companyId = `portal-log-${randomUUID()}`;
    const fetchMock = mockFetch(async () => jobsResponse(companyId));
    const logStartPosition = (await readFile(logFile, "utf8").catch(() => ""))
      .length;

    const result = await fetchJobCounts("greenhouse", companyId);

    assert.deepEqual(result, { total: 2, fresh: 1 });
    assert.equal(fetchMock.callCount(), 1);

    const logText = await waitForLogText(companyId, logStartPosition);
    assert.match(logText, /"name": "Portal\.FetchJobCounts"/);
    assert.match(logText, /"greenhouse GET JobsBasic": 1/);
    assert.match(logText, new RegExp(`"id": "${companyId}"`));
    assert.match(logText, /"ats": "greenhouse"/);
    assert.match(logText, /"metrics": \{\s+"ms": \d+,\s+"bytes": \d+\s+\}/);
  });
});
