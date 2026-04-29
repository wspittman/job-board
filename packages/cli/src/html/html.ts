import { markdownToHtml } from "dry-utils-text";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";

const inPlace: Place = { group: "html", stage: "in" };
const outPlace: Place = { group: "html", stage: "out" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the frontend blog folder. */
export const blogFolder = path.join(__dirname, "../../../frontend/src/blog");

const blogCmd: Command = {
  args: "<SLUG>",
  usage:
    "Convert a frontmatter markdown in packages/frontend/src/blog/<SLUG>.md to a full HTML page",
  async run(args: string[]): Promise<void> {
    let [slug = ""] = args;
    slug = slug.trim();

    if (!slug || slug.match(/[^a-zA-Z0-9_-]/)) {
      throw new CommandError("Invalid argument: SLUG");
    }

    return runBlog(slug);
  },
};

const fileCmd: Command = {
  args: "<NAME>",
  usage: "Convert a markdown file in logs/html/in to HTML in logs/html/out",
  async run(args: string[]): Promise<void> {
    let [file = ""] = args;
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

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  slug: string;
}

/**
 * Parses YAML frontmatter and body from a markdown string.
 * @param text The raw markdown text.
 * @returns The parsed frontmatter and body, or undefined if parsing fails.
 */
export function parseFrontmatter(
  text: string,
): { frontmatter: BlogFrontmatter; body: string } | undefined {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return undefined;

  const [, yamlBlock, body] = match;
  const frontmatter: Partial<BlogFrontmatter> = {};

  for (const line of (yamlBlock ?? "").split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (
      key === "title" ||
      key === "description" ||
      key === "date" ||
      key === "slug"
    ) {
      frontmatter[key] = value;
    }
  }

  if (
    !frontmatter.title ||
    !frontmatter.description ||
    !frontmatter.date ||
    !frontmatter.slug
  ) {
    return undefined;
  }

  return {
    frontmatter: frontmatter as BlogFrontmatter,
    body: (body ?? "").trim(),
  };
}

/**
 * Converts a frontmatter markdown file in the blog folder to a full HTML page.
 * @param slug The slug of the blog post (filename without extension).
 * @param folder The folder to read from and write to. Defaults to the frontend blog folder.
 */
export async function runBlog(
  slug: string,
  folder = blogFolder,
): Promise<void> {
  const mdPath = path.join(folder, `${slug}.md`);
  const templatePath = path.join(folder, "template.htm");
  const outPath = path.join(folder, `${slug}.html`);

  let mdText: string;
  try {
    mdText = await readFile(mdPath, "utf-8");
  } catch {
    throw new CommandError(`File not found: ${slug}.md`);
  }

  const parsed = parseFrontmatter(mdText);
  if (!parsed) {
    throw new CommandError("Invalid or missing frontmatter in markdown file");
  }

  const { frontmatter, body } = parsed;

  let template: string;
  try {
    template = await readFile(templatePath, "utf-8");
  } catch {
    throw new CommandError("Blog template not found");
  }

  const sectionHtml = markdownToHtml(body);
  const headerHtml = `\n          <h1>${frontmatter.title}</h1>\n          <p>${frontmatter.date}</p>\n        `;

  const output = template
    .replace("{{TITLE}}", frontmatter.title)
    .replace("{{DESCRIPTION}}", frontmatter.description)
    .replace("{{SLUG}}", frontmatter.slug)
    .replace("{{HEADER_HTML}}", headerHtml)
    .replace("{{SECTION_HTML}}", `\n${sectionHtml}\n        `);

  await writeFile(outPath, output, "utf-8");
}
