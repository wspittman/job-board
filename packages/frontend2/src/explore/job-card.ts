import type { Job } from "../api/apiTypes.ts";
import "../components/chip.ts";
import type { Chip } from "../components/chip.ts";
import { ComponentBase } from "../components/componentBase.ts";
import css from "./job-card.css?raw";
import html from "./job-card.html?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  // init-only
  job: Job;
  onClick?: (id: string) => void;
  // editable
  isSelected: boolean;
}

export class JobCard extends ComponentBase {
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

    const realOnClick = onClick ? () => onClick(job.id) : undefined;
    this.setOnClick("container", realOnClick);

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
          const chip = document.createElement("jb-chip") as Chip;
          chip.init({ label });
          chipsEl.appendChild(chip);
        }
      }
    }
  }
}

ComponentBase.register("explore-job-card", JobCard);
