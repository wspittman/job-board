import { execSync } from "node:child_process";

const allowedCommands = ["update", "run", "install"];
const [isFull] = process.argv.slice(2);

function npmCommand(cmd, ...args) {
  if (!allowedCommands.includes(cmd)) {
    throw new Error(`Command ${cmd} is not allowed.`);
  }

  const fullCmd = `npm ${cmd} ${args.join(" ")}`;

  try {
    console.log(`\n###\nRunning: ${fullCmd}\n###`);
    execSync(fullCmd, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: ${fullCmd}`);
    process.exit(1);
  }
}

if (!!isFull) {
  npmCommand("update", "--min-release-age", 5);
  npmCommand("run", "clean");
  npmCommand("install");
}
npmCommand("run", "lint");
npmCommand("run", "format");
npmCommand("run", "test");
