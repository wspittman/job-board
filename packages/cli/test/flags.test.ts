import test from "node:test";
import assert from "node:assert/strict";
import { parseCommandLine } from "../src/core/flags.ts";

test("parseCommandLine separates args and flags", () => {
  const parsed = parseCommandLine([
    "api:add-companies",
    "greenhouse",
    "a",
    "b",
    "--env",
    "prod",
    "--apply",
  ]);

  assert.equal(parsed.commandName, "api:add-companies");
  assert.deepEqual(parsed.args, ["greenhouse", "a", "b"]);
  assert.deepEqual(parsed.flags, { env: "prod", apply: true });
});
