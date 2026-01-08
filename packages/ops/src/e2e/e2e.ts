import assert from "node:assert/strict";
import { config } from "../config.ts";
import { fetcher } from "../fetcher.ts";
import { CommandError, type Command } from "../types.ts";
import { flows } from "./flows.ts";
import type { Step } from "./step.ts";

const { LOCAL_API_TOKEN, GREENHOUSE_IDS, LEVER_IDS } = config;
const FLOW_NAMES = Object.keys(flows);

export const e2e: Command = {
  usage: () => ["<FLOW>", `FLOW: ${FLOW_NAMES.join("|")}`],
  prerequisite,
  run: async ([flow]: string[]): Promise<void> => {
    if (!flow || !FLOW_NAMES.includes(flow)) {
      throw new CommandError("Invalid argument: FLOW");
    }

    await runFlow(flow);
  },
};

function prerequisite(): void {
  assert.notEqual(LOCAL_API_TOKEN, "unset", "ENV: LOCAL_API_TOKEN unset");
  assert.ok(GREENHOUSE_IDS.length > 0, "ENV: GREENHOUSE_IDS <= 0");
  assert.ok(LEVER_IDS.length > 0, "ENV: LEVER_IDS <= 0");
}

/**
 * Execute the named flow against the configured backend API.
 * @param name - Flow identifier to execute.
 */
async function runFlow(name: string): Promise<void> {
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
  { name, method, path, expectStatus, expectBody, asyncWait, ...opts }: Step,
): Promise<void> {
  console.log(`\n[${n}/${total}] ${method} ${path}: ${name}`);

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

  if (asyncWait) {
    console.log(`\n${asyncWait}, then press Enter to continue...`);
    await new Promise<void>((resolve) => {
      // When you attach a data listener to process.stdin, it switches the stream into "flowing" mode.
      // To allow the script to exit, you need to explicitly pause() the stdin stream after receiving the data.
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.pause();
        resolve();
      });
    });
  }
}
