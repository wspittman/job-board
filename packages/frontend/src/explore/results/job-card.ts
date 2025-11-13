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

/**
 * Custom element that renders a concise summary of a job posting.
 */
export class JobCard extends ComponentBase {
  #isSelected = false;

  /**
   * Applies the job card template and default styles to the element instance.
   */
  constructor() {
    super(html, cssSheet);
  }

  /**
   * Factory helper that builds a job card element populated with job details.
   * @param job - Job information to display.
   * @param onClick - Optional click handler invoked with the job ID.
   * @param isSelected - Whether the card should start in the selected state.
   * @returns A fully configured job card element.
   */
  static create({ job, onClick, isSelected }: Props) {
    const element = document.createElement(tag);

    const { title, company, isRemote, location, postTS, facets } = job ?? {};
    const { salary, experience, summary } = facets ?? {};

    const postDays = Math.floor((Date.now() - postTS) / (1000 * 60 * 60 * 24));
    const showRecencyChip = postDays < 30;
    const recencyChipText = postDays < 7 ? "New" : "Recent";
    const loc = isRemote ? "Remote" : location;
    const postedText = !Number.isNaN(postDays) ? postDays || "Today" : "";
    const postedSuffix = postDays ? "days ago" : "";

    element.setManyTexts({
      title,
      company,
      summary,
    });

    element.#createChips([
      [showRecencyChip, recencyChipText],
      [loc, loc],
      [salary, `$${salary?.toLocaleString()}`],
      [experience != null, `${experience} yrs exp`],
      [postTS, `${postedText} ${postedSuffix}`.trim()],
    ]);

    const realOnClick = onClick ? () => onClick(job.id) : undefined;
    element.setOnClick("container", realOnClick);

    element.isSelected = !!isSelected;

    return element;
  }

  /**
   * Updates the selected state styling and accessibility attributes for the card.
   * @param value - Whether the card should appear selected.
   */
  set isSelected(value: boolean) {
    if (this.#isSelected === value) return;
    this.#isSelected = value;

    const el = this.getEl("container");
    if (el) {
      el.classList.toggle("is-selected", this.#isSelected);
      el.setAttribute("aria-pressed", String(this.#isSelected));
    }
  }

  #createChips(pairs: [unknown, string][]) {
    const chipsEl = this.getEl("chips");
    if (chipsEl) {
      const fragment = document.createDocumentFragment();

      for (const [condition, label] of pairs) {
        if (!!condition) {
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
