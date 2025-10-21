import type { Job } from "../api/apiTypes.ts";
import { ComponentBase } from "./componentBase.ts";
import css from "./explore-job-card.css?raw";
import html from "./explore-job-card.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class ExploreJobCard extends ComponentBase {
  #job?: Job;
  #isSelected = false;
  #onClick?: (id: string) => void;

  constructor() {
    super(html, cssSheet);
  }

  set job(value: Job | undefined) {
    if (this.#job?.id === value?.id) return;
    this.#job = value;

    const { title, company, location, postTS = 0, facets } = this.#job ?? {};
    const { salary, experience, summary } = facets ?? {};
    const postDays = Math.floor((Date.now() - postTS) / (1000 * 60 * 60 * 24));
    const postedText = !Number.isNaN(postDays) && (postDays || "today");
    const postedSuffix = postDays ? "days ago" : "";

    this.setManyTexts({
      title,
      company,
      location,
      salary: salary?.toLocaleString(),
      experience: experience ? `${experience} years experience` : "",
      "posted-date": `${postedText} ${postedSuffix}`,
      summary,
    });
  }

  set isSelected(value: boolean) {
    if (this.#isSelected === value) return;
    this.#isSelected = value;

    const el = this.getEl<HTMLElement>("container");
    if (el) {
      el.classList.toggle("is-selected", value);
      el.setAttribute("aria-pressed", String(value));
    }
  }

  set onClick(value: ((id: string) => void) | undefined) {
    if (this.#onClick === value) return;
    this.#onClick = value;

    const el = this.getEl<HTMLElement>("container");
    if (el) {
      el.onclick = () => this.#onClick?.(this.#job?.id ?? "");
    }
  }
}

ComponentBase.register("explore-job-card", ExploreJobCard);
