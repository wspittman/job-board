import { markdownToHtml } from "dry-utils-text";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";
import { validateFileName } from "../utils/utils.ts";

const inPlace: Place = { group: "html", stage: "in" };
const outPlace: Place = { group: "html", stage: "out" };

const fileCmd: Command = {
  args: "<NAME>",
  usage: "Convert a markdown file in logs/html/in to HTML in logs/html/out",
  async run(args: string[]): Promise<void> {
    const file = validateFileName("FILE_NAME", args[0]);
    const text = await readText({ ...inPlace, file });

    if (!text) {
      throw new CommandError(`File not found: ${file}`);
    }

    const content = markdownToHtml(text);

    await writeText(content, { ...outPlace, file });
  },
};

export const html: Command = {
  args: "<SUBCOMMAND> <ARGS>",
  usage: "Convert markdown to HTML",
  subCommands: {
    file: fileCmd,
  },
};
