import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

const INCLUDE_PATTERN = new RegExp(
  String.raw`^(\s*)<!--\s*@include:\s*([^\s]+)\s*-->`,
  "gm"
);

/**
 * A Vite plugin to include HTML partials using `<!-- @include: path/to/file.html -->` syntax.
 *
 * - The include directive must be on its own line, preceded only by whitespace.
 * - Partials can be nested.
 * - Circular dependencies are detected.
 * - Included paths are relative to the file they are in.
 * - Indentation of the include directive is preserved in the output.
 */
export function htmlPartials(): Plugin {
  return {
    name: "html-partials",
    enforce: "pre",
    // Runs for any HTML Vite serves (dev + build, including multipage)
    async transformIndexHtml(html, ctx) {
      // ctx.filename is the absolute path of the current html being transformed
      return expand(html, ctx.filename);
    },
  };
}

async function expand(
  html: string,
  fromFile: string,
  seen = new Set<string>()
): Promise<string> {
  // Normalize line endings
  html = html.replaceAll(/\r/g, "").replaceAll(/\n+/g, "\n");

  const matches = [...html.matchAll(INCLUDE_PATTERN)];

  if (!matches.length) {
    return html;
  }

  const dir = dirname(fromFile);
  const parts: (string | Promise<string>)[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const [fullMatch, indentation, relPath] = match;
    const offset = match.index;

    parts.push(html.slice(lastIndex, offset));
    lastIndex = offset + fullMatch.length;

    const absPath = resolve(dir, relPath!);
    if (seen.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath}`);
    }

    parts.push(injectSection(absPath, indentation ?? "", seen));
  }

  parts.push(html.slice(lastIndex));

  const resolvedParts = await Promise.all(parts);
  return resolvedParts.join("");
}

async function injectSection(
  path: string,
  indentation: string,
  seen: Set<string>
): Promise<string> {
  const file = await readFile(path, "utf8");
  const expandedContent = await expand(file, path, new Set(seen).add(path));

  return expandedContent
    .split("\n")
    .map((line) => (line ? indentation + line : line))
    .join("\n");
}
