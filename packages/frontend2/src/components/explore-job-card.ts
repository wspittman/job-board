import type { Job } from "../api/apiTypes.ts";
import { ComponentBase } from "./componentBase.ts";
import css from "./explore-job-card.css?raw";
import html from "./explore-job-card.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class ExploreJobCard extends ComponentBase {
  #job?: Job;
  #isSelected = false;

  constructor() {
    super(html, cssSheet);
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

  set job(value: Job | undefined) {
    if (this.#job?.id === value?.id) return;

    this.#job = value;
    this.#render();
  }

  #render() {
    const { title, company, location, postTS = 0, facets } = this.#job ?? {};
    const { salary, experience, summary } = facets ?? {};
    const postDays = Math.floor((Date.now() - postTS) / (1000 * 60 * 60 * 24));
    const postedText = !Number.isNaN(postDays) && (postDays || "today");
    const postedSuffix = postDays ? "days ago" : "";

    this.setText("title", title);
    this.setText("company", company);
    this.setText("location", location);
    this.setText("salary", salary?.toLocaleString());
    this.setText(
      "experience",
      experience ? `${experience} years experience` : ""
    );
    this.setText("posted-date", `${postedText} ${postedSuffix}`);
    this.setText("summary", summary);
  }
}

ComponentBase.register("explore-job-card", ExploreJobCard);
