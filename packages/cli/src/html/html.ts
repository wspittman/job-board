import { markdownToHtml } from "dry-utils-text";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";
import { validateFileName } from "../utils/utils.ts";

interface Blog {
  title: string;
  description: string;
  date: string;
  slug: string;
  content: string;
}

type BEntry = [keyof Blog, string];
const fmKeySet = new Set<keyof Blog>(["title", "description", "date", "slug"]);

const inPlace: Place = { group: "html", stage: "in" };
const outPlace: Place = { group: "html", stage: "out" };
const blogPlace: Place = {
  ...inPlace,
  folder: "../../../../frontend/src/blog",
};

function readFMLine(line: string): BEntry | undefined {
  const idx = line.indexOf(":") || 0;
  const key = line.slice(0, idx).trim() as keyof Blog;
  const value = line.slice(idx + 1).trim();
  if (fmKeySet.has(key) && value) {
    return [key, value];
  }
  return undefined;
}

/**
 * Parses YAML frontmatter and body from a markdown string.
 * @param text The raw markdown text.
 * @returns The parsed frontmatter and body, or undefined if parsing fails.
 */
export function parseFrontmatter(text: string): Blog | undefined {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return undefined;

  const [, yamlBlock = "", body = ""] = match;

  const fm = yamlBlock.split("\n").map(readFMLine).filter(Boolean) as BEntry[];

  if (new Set(fm.map((entry) => entry[0])).size !== fmKeySet.size) {
    return undefined;
  }

  return {
    ...Object.fromEntries(fm),
    content: body.trim(),
  } as Blog;
}

/**
 * Converts a frontmatter markdown file in the blog folder to a full HTML page.
 * @param slug The slug of the blog post (filename without extension).
 */
export async function runBlog(slug: string): Promise<void> {
  const template = await readText({ ...blogPlace, file: "template" }, "htm");
  if (!template) {
    throw new CommandError("Blog template not found");
  }

  const mdText = await readText({ ...blogPlace, file: slug });
  if (!mdText) {
    throw new CommandError(`File not found: ${slug}.md`);
  }

  const blog = parseFrontmatter(mdText);
  if (!blog) {
    throw new CommandError("Invalid or missing frontmatter in markdown file");
  }

  const headerHtml = markdownToHtml(`# ${blog.title}\n\n${blog.date}`);
  const sectionHtml = markdownToHtml(blog.content);

  const output = template
    .replace("{{TITLE}}", blog.title)
    .replace("{{DESCRIPTION}}", blog.description)
    .replace("{{SLUG}}", blog.slug)
    .replace("{{HEADER_HTML}}", headerHtml)
    .replace("{{SECTION_HTML}}", `\n${sectionHtml}\n        `);

  await writeText(output, { ...blogPlace, file: slug }, "html");
}

const blogCmd: Command = {
  args: "<SLUG>",
  usage: "Convert a frontmatter markdown to full HTML page in frontend blog",
  async run(args: string[]): Promise<void> {
    const slug = validateFileName("SLUG", args[0]);
    return runBlog(slug);
  },
};

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
    blog: blogCmd,
    file: fileCmd,
  },
};
