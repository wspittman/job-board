import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { suite, test } from "node:test";
import { parseEnv } from "node:util";
import { setupEnv } from "./setup-agent-env.mjs";

suite("cloud setup environment", () => {
  for (const existing of [undefined, "backend", "cli"]) {
    test(`creates missing files with shared auth; existing=${existing}`, (t) => {
      const root = mkdtempSync(path.join(tmpdir(), "job-board-setup-"));
      t.after(() => rmSync(root, { recursive: true, force: true }));
      for (const workspace of ["backend", "cli"]) {
        const dir = path.join(root, "packages", workspace);
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          path.join(dir, ".env.example"),
          "# Keep template comments\nADMIN_TOKEN=unset\nOPENAI_API_KEY=unset\n",
        );
      }
      const saved =
        "# Keep existing config\nADMIN_TOKEN=existing-local-token-123\nOPENAI_API_KEY=existing-key\n";
      if (existing)
        writeFileSync(path.join(root, "packages", existing, ".env"), saved);

      setupEnv(root);
      const contents = ["backend", "cli"].map((workspace) =>
        readFileSync(path.join(root, "packages", workspace, ".env"), "utf8"),
      );
      const [backend, cli] = contents.map(parseEnv);
      assert.equal(backend["ADMIN_TOKEN"], cli["ADMIN_TOKEN"]);
      assert.ok(backend["ADMIN_TOKEN"].length >= 16);
      for (const [index, workspace] of ["backend", "cli"].entries()) {
        if (workspace === existing) {
          assert.equal(contents[index], saved);
        } else {
          assert.ok(contents[index].includes("# Keep template comments"));
          assert.equal(
            parseEnv(contents[index])["DATABASE_MOCK_DATA_JSON"],
            "{}",
          );
          assert.equal(
            parseEnv(contents[index])["OPENAI_API_KEY"],
            "local-placeholder-not-a-real-key",
          );
        }
      }
      setupEnv(root);
      assert.deepEqual(
        ["backend", "cli"].map((workspace) =>
          readFileSync(path.join(root, "packages", workspace, ".env"), "utf8"),
        ),
        contents,
      );
    });
  }
});
