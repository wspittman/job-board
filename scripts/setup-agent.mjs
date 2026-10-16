import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setupEnv } from "./setup-agent-env.mjs";

/**
 * Sets up a Cloud-based Agent development environment by installing dependencies and creating basic .env files
 *
 * At conclusion of this script,
 * - `npm run pre-checkin` should succeed
 * - `npm run cli -- help` should succeed
 *   - cli actions that require a real OpenAI key will still fail
 * - `npm run start:backend` should succeed
 *   - The backend will be connected to an empty in-memory database, and will not persist data between restarts
 *   - backend actions that require a real OpenAI key will still fail
 */

if (Number(process.versions.node.split(".")[0]) < 24) {
  console.error(
    `Setup requires Node.js 24 or newer; found ${process.version}.`,
  );
  process.exit(1);
}

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

console.log("Running npm ci...");
const result = spawnSync(
  "npm",
  [
    "ci",
    "--include=dev",
    "--include=optional",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.error || result.status !== 0) {
  console.error(
    `Setup failed: ${result.error?.message ?? (result.signal ? `npm terminated by ${result.signal}` : `npm exited with status ${result.status}`)}. Check the npm output above, registry access, and filesystem permissions.`,
  );
  process.exit(result.status || 1);
}

try {
  setupEnv(repoRoot);
} catch (error) {
  console.error(`Environment setup failed: ${error.message}`);
  process.exit(1);
}
