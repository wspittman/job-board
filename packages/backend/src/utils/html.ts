import { decode } from "html-entities";

/**
 * A simple HTML-strip function that also decodes HTML entities.
 */
export function removeHtml(html: string): string {
  return decode(html)
    .replace(/<[^>]*>/g, "\n")
    .replace(/\s?\n\s?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/&nbsp;/g, " ")
    .trim();
}
