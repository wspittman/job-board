import type { JobModel } from "../../api/apiTypes.ts";
import { Chip } from "../../components/chip.ts";
import { ComponentBase } from "../../components/componentBase.ts";

import css from "./job-card.css?raw";
import html from "./job-card.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-job-card";

interface Props {
  job: JobModel;
  onClick?: (id: string) => void;

  // editable
  isSelected?: boolean;
}

export class JobCard extends ComponentBase {
  #isSelected = false;

  constructor() {
    super(html, cssSheet);
  }

  static create({ job, onClick, isSelected }: Props) {
    const element = document.createElement(tag);

    const { title, company, isRemote, location, postTS, facets } = job ?? {};
    const { salary, experience, summary } = facets ?? {};

    const postDays = Math.floor((Date.now() - postTS) / (1000 * 60 * 60 * 24));
    const postedText = !Number.isNaN(postDays) ? postDays || "today" : "";
    const postedSuffix = postDays ? "days ago" : "";
    const showRecencyChip = postDays < 30;
    const recencyChipText = postDays < 7 ? "New" : "Recent";
    const hasExperience = experience != null;

    element.setManyTexts({
      title,
      company,
      location,
      salary: salary?.toLocaleString(),
      experience: hasExperience ? `${experience} years experience` : "",
      "posted-date": `${postedText} ${postedSuffix}`.trim(),
      summary,
    });

    element.#createChips([
      [!!isRemote, "Remote"],
      [showRecencyChip, recencyChipText],
    ]);

    const realOnClick = onClick ? () => onClick(job.id) : undefined;
    element.setOnClick("container", realOnClick);

    element.isSelected = !!isSelected;

    return element;
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
      const fragment = document.createDocumentFragment();

      for (const [condition, label] of pairs) {
        if (condition) {
          fragment.appendChild(Chip.create({ label }));
        }
      }

      chipsEl.replaceChildren(fragment);
    }
  }
}

ComponentBase.register(tag, JobCard);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: JobCard;
  }
}
