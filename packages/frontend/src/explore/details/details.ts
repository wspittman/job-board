import type { JobModel } from "../../api/jobModel.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { DetailEmbed } from "./detail-embed.ts";

import css from "./details.css?raw";
import html from "./details.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-details";

/**
 * Custom element that displays detailed information for a selected job.
 */
export class Details extends ComponentBase {
  readonly #applyLink: HTMLAnchorElement;
  readonly #detailEmbed: DetailEmbed;
  #job?: JobModel;

  /**
   * Creates a details panel and wires up references to internal elements.
   */
  constructor() {
    super(html, cssSheet);
    this.#applyLink = this.getEl<HTMLAnchorElement>("apply")!;
    this.#detailEmbed = this.getEl<DetailEmbed>("description")!;
  }

  /**
   * Updates the job being displayed and re-renders the panel contents.
   * @param value - The job to render, or undefined to clear the panel.
   */
  async updateJob(value: JobModel | undefined) {
    if (this.#job?.id === value?.id) return;

    requestAnimationFrame(() => (this.scrollTop = 0));
    this.#job = value;
    await this.#render();
  }

  async #render() {
    if (!this.#job) return;

    const { title, company, location, salary, experience, postDate } =
      await this.#job.getDisplayStrings();

    this.setManyTexts({
      heading: title,
      company,
      salary,
      experience,
      location,
      "posted-date": postDate,
    });

    this.#detailEmbed.description = this.#job.description;
    this.#applyLink.href = this.#job.applyUrl;
    this.#applyLink.setAttribute(
      "aria-label",
      `Apply for ${title} position at ${company}`
    );
  }
}

ComponentBase.register(tag, Details);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Details;
  }
}
