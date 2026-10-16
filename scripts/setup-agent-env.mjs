import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

/** Creates missing workspace .env files for local use, preserving existing files. */
export function setupEnv(repoRoot) {
  const workspaces = ["backend", "cli"].map((name) => {
    const dir = path.join(repoRoot, "packages", name);
    try {
      return {
        name,
        dir,
        existing: readFileSync(path.join(dir, ".env"), "utf8"),
      };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      return { name, dir };
    }
  });
  if (workspaces.every((workspace) => workspace.existing !== undefined)) return;

  const adminToken =
    workspaces
      .filter((workspace) => workspace.existing !== undefined)
      .map((workspace) => parseEnv(workspace.existing).ADMIN_TOKEN)
      .find((token) => token?.trim().length >= 16) ??
    randomBytes(24).toString("hex");
  const quote = ["'", '"', "`"].find((char) => !adminToken.includes(char));
  if (!quote)
    throw new Error("Cannot quote existing ADMIN_TOKEN in the new .env file.");

  for (const workspace of workspaces) {
    if (workspace.existing !== undefined) continue;
    const template = readFileSync(
      path.join(workspace.dir, ".env.example"),
      "utf8",
    );
    const content = template
      .replace(
        /^ADMIN_TOKEN=.*$/m,
        () => `ADMIN_TOKEN=${quote}${adminToken}${quote}`,
      )
      .replace(
        /^OPENAI_API_KEY=.*$/m,
        "OPENAI_API_KEY=local-placeholder-not-a-real-key",
      );
    writeFileSync(
      path.join(workspace.dir, ".env"),
      `${content}\n# Agent setup: empty, non-persistent in-memory database.\nDATABASE_MOCK_DATA_JSON={}\n`,
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      `Created packages/${workspace.name}/.env for local development.`,
    );
  }
}
