import { markdownToHtml } from "dry-utils-text";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";

const inPlace: Place = { group: "html", stage: "in" };
const outPlace: Place = { group: "html", stage: "out" };

export const html: Command = {
  args: "<FILE_NAME>",
  usage: "Convert a markdown file in logs/html/in to HTML in logs/html/out",
  run,
};

async function run([file = ""]: string[]): Promise<void> {
  file = file.trim();

  if (!file || file.match(/[^a-zA-Z0-9_-]/)) {
    throw new CommandError("Invalid argument: FILE_NAME");
  }

  const text = await readText({ ...inPlace, file });

  if (!text) {
    throw new CommandError(`File not found: ${file}`);
  }

  const content = markdownToHtml(text);

  await writeText(content, { ...outPlace, file });
}
