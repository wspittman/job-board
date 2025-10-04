import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * A Vite plugin to include HTML partials using `<!-- @include: path/to/file.html -->` syntax.
 *
 * - The include directive must be on its own line, preceded only by whitespace.
 * - Partials can be nested.
 * - Circular dependencies are detected.
 * - Included paths are relative to the file they are in.
 * - Indentation of the include directive is preserved in the output.
 */
function htmlPartials(): Plugin {
  const includeRE = /^(\s*)<!--\s*@include:\s*([^\s]+)\s*-->/gm;

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
      .join("");
  }

  async function expand(
    html: string,
    fromFile: string,
    seen = new Set<string>()
  ): Promise<string> {
    const dir = dirname(fromFile);
    const matches = [...html.matchAll(includeRE)];

    if (matches.length === 0) {
      return html;
    }

    const parts: (string | Promise<string>)[] = [];
    let lastIndex = 0;

    for (const match of matches) {
      const [fullMatch, indentation, relPath] = match;
      const offset = match.index!;

      parts.push(html.slice(lastIndex, offset));
      lastIndex = offset + fullMatch.length;

      const absPath = resolve(dir, relPath);
      if (seen.has(absPath)) {
        throw new Error(`Circular include detected: ${absPath}`);
      }

      parts.push(injectSection(absPath, indentation, seen));
    }

    parts.push(html.slice(lastIndex));

    const resolvedParts = await Promise.all(parts);
    return resolvedParts.join("");
  }

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

export default defineConfig({
  plugins: [htmlPartials()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "faq.html"),
      },
    },
  },
});
