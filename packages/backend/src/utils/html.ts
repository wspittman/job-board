import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";
import Showdown from "showdown";
import TurndownService from "turndown";

/**
 * Standardizes untrusted HTML content by converting it to Markdown and then back to sanitized HTML.
 */
export function standardizeUntrustedHtml(html: string): string {
  const decoded = decode(html);

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(decoded);

  const converter = new Showdown.Converter();
  const newHtml = converter.makeHtml(markdown);

  return sanitizeHtml(newHtml, {
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  });
}
