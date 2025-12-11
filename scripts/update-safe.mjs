import { execSync } from "node:child_process";

const d = new Date();
d.setDate(d.getDate() - 7);
const dateStr = d.toISOString().slice(0, 10);

console.log(`Running: npm update --before ${dateStr}`);

execSync(`npm update --before ${dateStr}`, { stdio: "inherit" });
