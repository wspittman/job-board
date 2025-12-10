import { ComponentBase } from "../../components/componentBase";

const html = '<div id="content"></div>';
const cssSheet = ComponentBase.createCSSSheet(
  "* { font: 14px/1.5 system-ui, sans-serif; }",
);

/**
 * Lightweight container for rendering sanitized job descriptions.
 */
export class DetailEmbed extends ComponentBase {
  /**
   * Initializes the embed with minimal styling and markup.
   */
  constructor() {
    super(html, cssSheet, { omitPartsCss: true });
  }

  /**
   * Replaces the inner HTML content with the provided job description.
   * @param descriptionHtml - Pre-formatted HTML for the job description.
   */
  set description(descriptionHtml: string) {
    this.getEl("content")!.innerHTML = descriptionHtml;
  }
}

ComponentBase.register("explore-detail-embed", DetailEmbed);

declare global {
  interface HTMLElementTagNameMap {
    "explore-detail-embed": DetailEmbed;
  }
}
