import { execSync } from "node:child_process";

const allowedCommands = ["update", "run", "install"];
const [isFull] = process.argv.slice(2);

function npmCommand(cmd, ...args) {
  if (!allowedCommands.includes(cmd)) {
    throw new Error(`Command ${cmd} is not allowed.`);
  }

  try {
    const fullCmd = `npm ${cmd} ${args.join(" ")}`;
    console.log(`\n###\nRunning: ${fullCmd}\n###`);
    execSync(fullCmd, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: ${fullCmd}`);
    process.exit(1);
  }
}

const d = new Date();
d.setDate(d.getDate() - 7);
const lastWeek = d.toISOString().slice(0, 10);

if (!!isFull) {
  npmCommand("update", "--before", lastWeek);
  npmCommand("run", "clean");
  npmCommand("install");
}
npmCommand("run", "lint");
npmCommand("run", "format:write");
npmCommand("run", "test");
