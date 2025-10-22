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

    const {
      title,
      company,
      isRemote,
      location,
      postTS = 0,
      facets,
    } = this.#job ?? {};
    const { salary, experience, summary } = facets ?? {};
    const postDays = Math.floor((Date.now() - postTS) / (1000 * 60 * 60 * 24));
    const postedText = !Number.isNaN(postDays) && (postDays || "today");
    const postedSuffix = postDays ? "days ago" : "";
    const showRecencyChip = postDays < 30;
    const recencyChipText = postDays < 7 ? "New" : "Recent";

    this.setManyTexts({
      title,
      company,
      location,
      salary: salary?.toLocaleString(),
      experience: experience ? `${experience} years experience` : "",
      "posted-date": `${postedText} ${postedSuffix}`,
      summary,
    });

    this.#createChips([
      [!!isRemote, "Remote"],
      [showRecencyChip, recencyChipText],
    ]);
  }

  set isSelected(value: boolean) {
    if (this.#isSelected === value) return;
    this.#isSelected = value;

    const el = this.getEl("container");
    if (el) {
      el.classList.toggle("is-selected", value);
      el.setAttribute("aria-pressed", String(value));
    }
  }

  set onClick(value: ((id: string) => void) | undefined) {
    if (this.#onClick === value) return;
    this.#onClick = value;

    const el = this.getEl("container");
    if (el) {
      el.onclick = () => this.#onClick?.(this.#job?.id ?? "");
    }
  }

  #createChips(pairs: [boolean, string][]) {
    const chipsEl = this.getEl("chips");
    if (chipsEl) {
      chipsEl.innerHTML = "";

      for (const [condition, label] of pairs) {
        if (condition) {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = label;
          chipsEl.appendChild(chip);
        }
      }
    }
  }
}

ComponentBase.register("explore-job-card", ExploreJobCard);
