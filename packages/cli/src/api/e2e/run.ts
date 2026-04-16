import { logger } from "dry-utils-logger";
import assert from "node:assert/strict";
import { CommandError } from "../../types.ts";
import { request } from "../client.ts";
import { assertE2EEnv } from "../guards.ts";
import type { ApiCommand } from "../types.ts";
import { flows } from "./flows.ts";
import type { Step } from "./step.ts";

const flowNames = Object.keys(flows);

export const runE2E: ApiCommand = {
  usage: () => ["<FLOW>", `FLOW: ${flowNames.join("|")}`],
  run: async ([flow], context): Promise<void> => {
    assertE2EEnv();

    if (!flow || !flowNames.includes(flow)) {
      throw new CommandError("Invalid argument: FLOW");
    }

    if (context.runtime.profile !== "local") {
      throw new CommandError(
        "E2E flow execution is restricted to --profile=local",
      );
    }

    await executeFlow(flow);
  },
};

async function executeFlow(name: string): Promise<void> {
  const flow = flows[name];

  if (!flow) {
    throw new Error(`Unknown flow "${name}".`);
  }

  logger.info(`Running flow "${name}"`);

  for (let index = 0; index < flow.length; index++) {
    await runStep(index + 1, flow.length, flow[index]!);
  }

  logger.info(`Flow "${name}" completed successfully.`);
}

async function runStep(
  position: number,
  total: number,
  { name, method, path, expectStatus, expectBody, asyncWait, ...opts }: Step,
): Promise<void> {
  logger.info(`[${position}/${total}] ${method} ${path}: ${name}`);

  const { status, value } = await request(method, path, "local", {
    ...opts,
    throwOnError: false,
  });

  logger.info(`[${status}]`, value);

  assert.equal(status, expectStatus, `FAIL: Step ${position} Wrong Status`);

  if (expectBody != undefined) {
    assert.partialDeepStrictEqual(
      value,
      expectBody,
      `FAIL: Step ${position} Wrong Body`,
    );
  }

  if (asyncWait) {
    logger.info(`${asyncWait}, then press Enter to continue...`);
    await new Promise<void>((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", () => {
        process.stdin.pause();
        resolve();
      });
    });
  }
}
