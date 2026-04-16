import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyRuntimeFlags,
  getProductionConfirmationPhrase,
  getRuntimeContext,
  resetRuntimeContext,
} from "../src/runtime.ts";

test("applyRuntimeFlags keeps command args and captures flags", () => {
  resetRuntimeContext();
  const args = applyRuntimeFlags([
    "greenhouse",
    "123",
    "--env",
    "prod",
    "--allow-production",
    "--confirm-production",
    getProductionConfirmationPhrase(),
    "--dry-run",
  ]);

  assert.deepEqual(args, ["greenhouse", "123"]);
  assert.deepEqual(getRuntimeContext(), {
    apiEnv: "prod",
    allowProduction: true,
    productionConfirmation: getProductionConfirmationPhrase(),
    dryRun: true,
  });
});

test("applyRuntimeFlags throws on invalid --env", () => {
  resetRuntimeContext();
  assert.throws(() => applyRuntimeFlags(["--env", "staging"]));
});
