import { markdownToHtml } from "dry-utils-text";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";

const inPlace: Place = { group: "blog", stage: "in" };
const outPlace: Place = { group: "blog", stage: "out" };

export const blogBuild: Command = {
  usage: () => "<POST_NAME>",
  run,
};

async function run([file = ""]: string[]): Promise<void> {
  file = file.trim();

  if (!file || file.match(/[^a-zA-Z0-9_-]/)) {
    throw new CommandError("Invalid argument: POST_NAME");
  }

  const text = await readText({ ...inPlace, file });

  if (!text) {
    throw new CommandError(`File not found: ${file}`);
  }

  const html = markdownToHtml(text);

  await writeText(html, { ...outPlace, file });
}
