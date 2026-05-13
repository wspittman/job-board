import { logger } from "dry-utils-logger";
import assert from "node:assert/strict";
import { CommandError, type Command } from "../types.ts";
import { apiCall } from "../utils/http.ts";
import { flows } from "./flows.ts";
import type { Step } from "./step.ts";

const FLOW_NAMES = Object.keys(flows);

export const e2e: Command = {
  args: "<FLOW>",
  usage: [
    "Run the e2e tests against a running local server",
    `FLOW: ${FLOW_NAMES.join("|")}`,
  ],
  run: async ([flow]: string[]): Promise<void> => {
    if (!flow || !FLOW_NAMES.includes(flow)) {
      throw new CommandError("Invalid argument: FLOW");
    }

    await runFlow(flow);
  },
};

/**
 * Execute the named flow against the configured backend API.
 * @param name - Flow identifier to execute.
 */
async function runFlow(name: string): Promise<void> {
  const flow = flows[name];

  if (!flow) {
    throw new Error(`Unknown flow "${name}".`);
  }

  logger.info(`Running flow "${name}"`);

  try {
    for (let i = 0; i < flow.length; i++) {
      await runStep(i + 1, flow.length, flow[i]!);
    }
  } catch (err) {
    if (err instanceof assert.AssertionError) {
      logger.error("Assertion Error", {
        message: err.message.split("\n")[0],
        expected: err.expected,
        actual: err.actual,
      });
      return;
    }
    throw err;
  }

  logger.info(`Flow "${name}" completed successfully.`);
}

async function runStep(
  n: number,
  total: number,
  { name, req, res, confirm }: Step,
): Promise<void> {
  const { method, path, ...opts } = req;
  logger.info(`[${n}/${total}] ${method} ${path}: ${name}`);

  const { status, value } = await apiCall(method, path, {
    ...opts,
    env: "local",
    throwOnError: false,
  });

  logger.info(`[${status}]`, value);

  assert.equal(status, res.status, `FAIL: Step ${n} Wrong Status`);
  if (res.value != undefined) {
    assert.partialDeepStrictEqual(
      value,
      res.value,
      `FAIL: Step ${n} Wrong Body`,
    );
  }

  if (confirm) {
    logger.info(`${confirm}, then press Enter to continue...`);
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
