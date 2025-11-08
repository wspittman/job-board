import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

const ICON_DIR = path.resolve(
  process.cwd(),
  "../../node_modules/lucide-static/icons"
);
const ICON_PATTERN = new RegExp(
  `^(\\s*)<svg[^>]*?\\sdata-icon="([^"]+)"[^>]*></svg>`,
  "gim"
);

const R_KEY = "RANDOM";
const R_TRI_KEY = "RANDOM-TRI";

const R_ICON_NAMES = [
  "alarm-clock",
  "angry",
  "arrow-left-right",
  "asterisk",
  "binary",
  "clock",
  "cloud-rain-wind",
  "dices",
  "drill",
  "drum",
  "file-stack",
  "frown",
  "hash",
  "heart-crack",
  "hourglass",
  "megaphone",
  "radio-tower",
  "sparkles",
  "speech",
  "trending-up-down",
  "volume-2",
  "wind",
  "wrench",
  "zap",
];

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
      return await expand(html);
    },

    async load(id) {
      if (!id.endsWith(".html?raw")) {
        return;
      }

      const filepath = id.split("?", 1)[0]!;
      const file = await readFile(filepath, "utf8");
      const html = await expand(file);

      // Return an ES module exporting the processed HTML
      return `export default ${JSON.stringify(html)};`;
    },
  };
}

async function expand(html: string): Promise<string> {
  const matches = [...html.matchAll(ICON_PATTERN)];

  if (matches.length === 0) {
    return html;
  }

  const parts: (string | Promise<string>)[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const [fullMatch, indent, name] = match;
    const offset = match.index;

    parts.push(html.slice(lastIndex, offset));
    lastIndex = offset + fullMatch.length;

    const iconName = name!;
    if (iconName === R_KEY) {
      parts.push(loadRandomIcon(indent ?? ""));
    } else if (iconName === R_TRI_KEY) {
      parts.push(loadRandomTri(indent ?? ""));
    } else {
      parts.push(loadIcon(iconName, indent ?? ""));
    }
  }

  parts.push(html.slice(lastIndex));

  const resolvedParts = await Promise.all(parts);
  return resolvedParts.join("");
}

async function loadRandomTri(indent: string): Promise<string> {
  const loadPromises: Promise<string>[] = [];
  for (let row = 1; row <= 5; row++) {
    const countInRow = 6 - row;
    for (let col = 1; col <= countInRow; col++) {
      const idxStyle = `--tri-row: ${row}; --tri-col: ${col};`;
      loadPromises.push(loadRandomIcon(indent, idxStyle));
    }
  }

  const icons = await Promise.all(loadPromises);
  return icons.join("\n");
}

async function loadRandomIcon(
  indent: string,
  style: string = ""
): Promise<string> {
  const dc = getRandomColor();
  const ds = randInt(0, 3);
  const dx = randInt(-3, 3);
  const dy = randInt(-3, 3);
  const name = getRandomIconName();
  const icon = await loadIcon(name, indent + "  ");

  return [
    `${indent}<div class="random-icon" style="${style}--dc: ${dc}; --ds: ${ds}%; --dx: ${dx}%; --dy: ${dy}%;">`,
    icon,
    `${indent}</div>`,
  ].join("\n");
}

async function loadIcon(name: string, indent: string): Promise<string> {
  const file = path.join(ICON_DIR, `${name}.svg`);
  try {
    const icon = (await readFile(file, "utf8")).replace(/\r?\n/g, "\n");
    return icon
      .split("\n")
      .filter(Boolean)
      .map((line) => (line ? indent + line : line))
      .join("\n");
  } catch {
    throw new Error(`Icon "${name}" not found.`);
  }
}

function getRandomColor(): string {
  const hue = 300 + randInt(0, 150);
  const saturation = randInt(70, 100);
  const lightness = randInt(35, 55);
  return `${hue} ${saturation}% ${lightness}%`;
}

function getRandomIconName(): string {
  const index = randInt(0, R_ICON_NAMES.length - 1);
  return R_ICON_NAMES[index]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
