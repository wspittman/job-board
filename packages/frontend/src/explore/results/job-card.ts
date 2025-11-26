import type { JobModel } from "../../api/jobModel.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { JobChips } from "../../components/job-chips.ts";

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
  /**
   * Factory helper that builds a job card element populated with job details.
   * @param job - Job information to display.
   * @param onClick - Optional click handler invoked with the job ID.
   * @param isSelected - Whether the card should start in the selected state.
   * @returns A fully configured job card element.
   */
  static async create({ job, onClick, isSelected }: Props) {
    const element = document.createElement(tag);

    element.getEl<JobChips>("chips")?.init({ job, useShort: true });

    const { title, company, summary } = await job.getDisplayDetail();

    element.setManyTexts({
      title,
      company,
      summary,
    });

    const realOnClick = onClick ? () => onClick(job.id) : undefined;
    element.setOnClick("container", realOnClick);

    element.isSelected = !!isSelected;
    element.#jobId = job.id;

    return element;
  }

  #isSelected = false;
  #jobId = "";

  /**
   * Applies the job card template and default styles to the element instance.
   */
  constructor() {
    super(html, cssSheet);
  }

  get jobId() {
    return this.#jobId;
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
}

ComponentBase.register(tag, JobCard);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: JobCard;
  }
}
