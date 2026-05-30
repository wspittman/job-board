import { ComponentBase } from "../../components/componentBase";

const cssSheet = ComponentBase.createCSSSheet(
  `* {
    font: var(--font-size-6)/1.5 var(--fonts);
    overflow-wrap: anywhere;
  },
  `,
);

/**
 * Lightweight container for rendering sanitized job descriptions.
 */
export class DetailEmbed extends ComponentBase {
  /**
   * Initializes the embed with minimal styling and markup.
   */
  constructor() {
    super("", cssSheet, { omitPartsCss: true });
  }

  /**
   * Replaces the inner HTML content with the provided job description.
   * @param descriptionHtml - Pre-formatted HTML for the job description.
   */
  set description(descriptionHtml: string) {
    this.container.innerHTML = descriptionHtml;
  }
}

ComponentBase.register("jobs-detail-embed", DetailEmbed);

declare global {
  interface HTMLElementTagNameMap {
    "jobs-detail-embed": DetailEmbed;
  }
}
