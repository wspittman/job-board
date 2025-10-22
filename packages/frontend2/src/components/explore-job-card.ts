import type { Job } from "../api/apiTypes.ts";
import { ComponentBase } from "./componentBase.ts";
import css from "./explore-job-card.css?raw";
import html from "./explore-job-card.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

export class ExploreJobCard extends ComponentBase {
  // Init-only
  #job?: Job;
  #onClick?: (id: string) => void;

  // Editable
  #isSelected = false;

  constructor() {
    super(html, cssSheet);
  }

  init(job: Job, isSelected: boolean, onClick?: (id: string) => void) {
    this.#job = job;
    this.#isSelected = isSelected;
    this.#onClick = onClick;
    this.#renderInit();
    this.#renderSelected();
  }

  set isSelected(value: boolean) {
    if (this.#isSelected === value) return;
    this.#isSelected = value;
    this.#renderSelected();
  }

  #renderSelected() {
    const el = this.getEl("container");
    if (el) {
      el.classList.toggle("is-selected", this.#isSelected);
      el.setAttribute("aria-pressed", String(this.#isSelected));
    }
  }

  #renderInit() {
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
