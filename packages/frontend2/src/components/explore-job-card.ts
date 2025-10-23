import type { Job } from "../api/apiTypes.ts";
import { ComponentBase } from "./componentBase.ts";
import css from "./explore-job-card.css?raw";
import html from "./explore-job-card.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  // init-only
  job: Job;
  onClick?: (id: string) => void;
  // editable
  isSelected: boolean;
}

export class ExploreJobCard extends ComponentBase {
  #isSelected = false;

  constructor() {
    super(html, cssSheet);
  }

  init({ job, onClick, isSelected }: Props) {
    const {
      title,
      company,
      isRemote,
      location,
      postTS = 0,
      facets,
    } = job ?? {};
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

    if (onClick) {
      const el = this.getEl("container");
      if (el) {
        el.onclick = () => onClick(job.id);
      }
    }

    this.isSelected = isSelected;
  }

  set isSelected(value: boolean) {
    if (this.#isSelected === value) return;
    this.#isSelected = value;

    const el = this.getEl("container");
    if (el) {
      el.classList.toggle("is-selected", this.#isSelected);
      el.setAttribute("aria-pressed", String(this.#isSelected));
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
