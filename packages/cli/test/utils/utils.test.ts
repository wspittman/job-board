import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import { CommandError, type Registry } from "../../src/types.ts";
import { asArray, commandUsage, runCommand } from "../../src/utils/utils.ts";
import { afterReset } from "../setup.ts";

after(afterReset);

suite("utils", () => {
  test("asArray: wraps a string into an array", () => {
    assert.deepEqual(asArray("one"), ["one"]);
  });

  test("asArray: returns the same array instance", () => {
    const values = ["one", "two"];

    assert.equal(asArray(values), values);
  });

  test("commandUsage: builds usage output with indent and multi-line usage", () => {
    const registry: Registry = {
      run: {
        usage: () => ["<id>", "--verbose"],
        run: async () => undefined,
      },
      status: {
        usage: () => "[--json]",
        run: async () => undefined,
      },
    };

    assert.deepEqual(commandUsage(registry, "  "), [
      "",
      "  run <id>",
      "    --verbose",
      "",
      "  status [--json]",
    ]);
  });

  test("runCommand: throws when command name is missing", async () => {
    await assert.rejects(runCommand({}, []), {
      name: "Error",
      message: "No command provided",
    });
  });

  test("runCommand: throws when command is not in registry", async () => {
    await assert.rejects(runCommand({}, ["missing"]), {
      name: "Error",
      message: 'Invalid Command "missing"',
    });
  });

  test("runCommand: executes prerequisite then run with remaining args", async () => {
    const callOrder: string[] = [];
    let receivedArgs: string[] = [];

    const registry: Registry = {
      sync: {
        usage: () => "",
        prerequisite: () => {
          callOrder.push("prerequisite");
        },
        run: async (args) => {
          callOrder.push("run");
          receivedArgs = args;
        },
      },
    };

    await runCommand(registry, ["sync", "first", "second"]);

    assert.deepEqual(callOrder, ["prerequisite", "run"]);
    assert.deepEqual(receivedArgs, ["first", "second"]);
  });

  test("runCommand: surfaces command errors", async () => {
    const registry: Registry = {
      fail: {
        usage: () => "",
        run: async () => {
          throw new CommandError("boom");
        },
      },
    };

    await assert.rejects(runCommand(registry, ["fail"]), {
      name: "Error",
      message: "boom",
    });
  });
});
