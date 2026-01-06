import assert from "node:assert/strict";
import { flows } from "../e2e/flows.ts";
import type { Step } from "../e2e/step.ts";
import { fetcher } from "../fetcher.ts";

export const FLOW_NAMES = Object.keys(flows);

/**
 * Execute the named flow against the configured backend API.
 * @param name - Flow identifier to execute.
 */
export async function runFlow(name: string): Promise<void> {
  const flow = flows[name];

  if (!flow) {
    throw new Error(`Unknown flow "${name}".`);
  }

  console.log(`Running flow "${name}"`);

  try {
    for (let i = 0; i < flow.length; i++) {
      await runStep(i + 1, flow.length, flow[i]!);
    }
  } catch (err) {
    if (err instanceof assert.AssertionError) {
      console.error(`\n${err.message}`);
      return;
    }
    throw err;
  }

  console.log(`\nFlow "${name}" completed successfully.`);
}

async function runStep(
  n: number,
  total: number,
  { name, method, path, expectStatus, expectBody, ...opts }: Step,
): Promise<void> {
  console.log(`\n[${n}/${total}] ${name}`);
  console.log(`${method} ${path}`);

  const { status, value } = await fetcher(method, path, {
    ...opts,
    env: "local",
    throwOnError: false,
  });

  console.log(`Status: ${status}`);
  console.dir(value, { depth: null });

  assert.equal(status, expectStatus, `FAIL: Step ${n} Wrong Status`);
  if (expectBody != undefined) {
    assert.partialDeepStrictEqual(
      value,
      expectBody,
      `FAIL: Step ${n} Wrong Body`,
    );
  }
}
