import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { suite, test } from "node:test";
import timers from "node:timers/promises";
import {
  createSubscribeAggregator,
  logCounter,
  logProperty,
  withLocalTelemetryContext,
} from "../../src/utils/telemetry.ts";

async function waitForLogText(expected: string): Promise<string> {
  const start = Date.now();
  let text = "";

  while (Date.now() - start < 500) {
    text = await readFile("logs/test.log", "utf8").catch(() => "");

    if (text.includes(expected)) {
      return text;
    }

    await timers.setTimeout(10);
  }

  return text;
}

suite("telemetry", () => {
  test("withLocalTelemetryContext: returns callback value and logs captured telemetry context", async () => {
    const aggregate = createSubscribeAggregator("ats", 2);
    const opName = `OpName-${randomUUID()}`;

    const result = await withLocalTelemetryContext(opName, async () => {
      logProperty("Input", { ats: "greenhouse", id: "company" });
      logProperty("Input", { full: true });
      logCounter("CacheHit");
      logCounter("CacheHit", 2);
      aggregate({
        tag: "greenhouse GET Jobs",
        dense: { name: "GET Jobs", ats: "greenhouse", id: "company" },
        metrics: { ms: 25 },
        blob: { ignored: true },
      });
      return { total: 13, fresh: 9 };
    });

    assert.deepEqual(result, { total: 13, fresh: 9 });

    const logText = await waitForLogText(opName);
    assert.match(logText, new RegExp(`"name": "${opName}"`));
    assert.match(logText, /"duration": \d+/);
    assert.match(logText, /"CacheHit": 3/);
    assert.match(logText, /"greenhouse GET Jobs": 1/);
    assert.match(logText, /"full": true/);
  });

  test("withLocalTelemetryContext: logs captured telemetry context and rethrows callback errors", async () => {
    const opName = `OpName-${randomUUID()}`;

    await assert.rejects(
      withLocalTelemetryContext(opName, async () => {
        logProperty("Input", { ats: "greenhouse", id: "missing-company" });
        throw new Error("Call failed");
      }),
      /Call failed/,
    );

    const logText = await waitForLogText(opName);
    assert.match(logText, new RegExp(`"name": "${opName}"`));
    assert.match(logText, /"duration": \d+/);
    assert.match(logText, /"id": "missing-company"/);
  });
});
