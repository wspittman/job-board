import { logger } from "dry-utils-logger";
import process from "node:process";

function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  logger.info(`Running command "${command}"`, args);
  return Promise.resolve();
}

main().catch((err) => {
  logger.error("Main:", err);
  process.exitCode = 1;
});
