import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

const ICON_DIR = path.resolve(
  process.cwd(),
  // TBD: This won't be right during prod deploy
  "../../node_modules/lucide-static/icons"
);
const ICON_PATTERN = new RegExp(
  `^(\\s*)<svg[^>]*?\\sdata-icon="([^"]+)"[^>]*></svg>`,
  "gim"
);

/**
 * A Vite plugin to inline Lucide icons in HTML files.
 *
 * It looks for `<svg data-icon="icon-name"></svg>` tags and replaces them
 * with the actual SVG content from the Lucide icon set.
 */
export function inlineLucideIcons(): Plugin {
  return {
    name: "inline-lucide-icons",
    enforce: "pre",

    async transformIndexHtml(html) {
      return expand(html);
    },
  };
}

async function loadIcon(name: string, indentation: string): Promise<string> {
  const file = path.join(ICON_DIR, `${name}.svg`);
  try {
    const icon = await readFile(file, "utf8");
    return icon
      .split("\n")
      .map((line) => (line ? indentation + line : line))
      .join("");
  } catch {
    throw new Error(`Icon "${name}" not found.`);
  }
}

async function expand(html: string): Promise<string> {
  const matches = [...html.matchAll(ICON_PATTERN)];

  if (matches.length === 0) {
    return html;
  }

  const parts: (string | Promise<string>)[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const [fullMatch, indentation, name] = match;
    const offset = match.index;

    parts.push(html.slice(lastIndex, offset));
    lastIndex = offset + fullMatch.length;

    parts.push(loadIcon(name!, indentation ?? ""));
  }

  parts.push(html.slice(lastIndex));

  const resolvedParts = await Promise.all(parts);
  return resolvedParts.join("");
}
