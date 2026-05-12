import { markdownToHtml } from "dry-utils-text";
import { CommandError, type Command } from "../types.ts";
import { readText, writeText, type Place } from "../utils/fileUtils.ts";
import { validateFileName } from "../utils/utils.ts";

interface Blog {
  title: string;
  description: string;
  date: string;
  content: string;
}

type BEntry = [keyof Blog, string];
const fmKeySet = new Set<keyof Blog>(["title", "description", "date"]);

const inPlace: Place = { group: "html", stage: "in" };
const outPlace: Place = { group: "html", stage: "out" };
const blogPlace: Place = {
  ...inPlace,
  folder: "../../../../frontend/src/blog",
};
const blogIndexPlace: Place = {
  ...inPlace,
  folder: "../../../../frontend/src",
  file: "blog",
};
const sitemapPlace: Place = {
  ...inPlace,
  folder: "../../../../frontend/src/public",
  file: "sitemap",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFMLine(line: string): BEntry | undefined {
  const idx = line.indexOf(":");
  if (idx === -1) return undefined;
  const key = line.slice(0, idx).trim() as keyof Blog;
  const value = line.slice(idx + 1).trim();
  if (fmKeySet.has(key) && value) {
    return [key, escapeHtml(value)];
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
 * @param overrides Optional Place overrides for testing (blog index and sitemap).
 */
export async function runBlog(
  slug: string,
  overrides?: { blogIndex?: Place; sitemap?: Place },
): Promise<void> {
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
    .replace("{{SLUG}}", slug)
    .replace("{{HEADER_HTML}}", headerHtml)
    .replace("{{SECTION_HTML}}", sectionHtml);

  await writeText(output, { ...blogPlace, file: slug }, "html");
  await updateBlogIndex(slug, blog, overrides?.blogIndex);
  await updateSitemap(slug, overrides?.sitemap);
}

/**
 * Inserts a new article card at the top of the blog list in blog.html.
 * Skips insertion if the slug is already present (idempotent).
 * @param slug The blog post slug.
 * @param blog The blog metadata to insert.
 * @param place Optional Place override; defaults to the frontend blog.html.
 */
export async function updateBlogIndex(
  slug: string,
  blog: Blog,
  place: Place = blogIndexPlace,
): Promise<void> {
  const content = await readText(place, "html");
  if (!content) {
    throw new CommandError("blog.html not found");
  }

  if (content.includes(`/blog/${slug}`)) return;

  const card = [
    '<article class="card">',
    "<header>",
    `<h2><a href="/blog/${slug}">${blog.title}</a></h2>`,
    `<time>${blog.date}</time>`,
    "</header>",
    `<p>${blog.description}</p>`,
    "</article>",
  ].join("\n");

  const marker = '<section class="blog-list">';
  const markerIdx = content.indexOf(marker);
  if (markerIdx === -1) {
    throw new CommandError("Blog list marker not found in blog.html");
  }

  const insertAt = content.indexOf("\n", markerIdx) + 1;
  const updated =
    content.slice(0, insertAt) + card + "\n" + content.slice(insertAt);
  await writeText(updated, place, "html");
}

/**
 * Adds a URL entry for the blog post to sitemap.xml.
 * Skips insertion if the slug is already present (idempotent).
 * @param slug The blog post slug.
 * @param place Optional Place override; defaults to the frontend sitemap.xml.
 */
export async function updateSitemap(
  slug: string,
  place: Place = sitemapPlace,
): Promise<void> {
  const content = await readText(place, "xml");
  if (!content) {
    throw new CommandError("sitemap.xml not found");
  }

  if (content.includes(`/blog/${slug}`)) return;

  const entry = [
    "  <url>",
    `    <loc>https://betterjobboard.net/blog/${slug}</loc>`,
    "    <changefreq>monthly</changefreq>",
    "    <priority>0.2</priority>",
    "  </url>",
  ].join("\n");

  const updated = content.replace("</urlset>", `${entry}\n</urlset>`);
  await writeText(updated, place, "xml");
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
