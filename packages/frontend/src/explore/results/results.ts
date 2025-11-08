import type { JobModel } from "../../api/apiTypes.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { JobCard } from "./job-card.ts";
import { MessageCard } from "./message-card.ts";

import css from "./results.css?raw";
import html from "./results.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-results";

interface Props {
  onSelect?: (jobId: string) => void;
}

/**
 * Custom element responsible for rendering job results and coordinating selection events.
 */
export class Results extends ComponentBase {
  #list: HTMLElement;
  #jobs: [string, JobCard][] = [];
  #onSelect?: (jobId: string) => void;

  /**
   * Initializes the results list container and associated template.
   */
  constructor() {
    super(html, cssSheet);
    this.#list = this.getEl("list")!;
  }

  /**
   * Sets up the selection callback and resets the results list.
   * @param onSelect - Handler invoked when a job card is selected.
   */
  init({ onSelect }: Props) {
    this.#onSelect = onSelect;
    this.jobs = undefined;
  }

  /**
   * Rebuilds the job list display from the provided dataset.
   * @param value - Array of job models to render, or undefined to clear the list.
   */
  set jobs(value: JobModel[] | undefined) {
    this.#jobs = [];
    const fragment = document.createDocumentFragment();
    const onClick = (id: string) => this.#selectCard(id);

    value?.forEach((job, index) => {
      const isSelected = index === 0;
      const card = JobCard.create({ job, isSelected, onClick });
      this.#jobs.push([job.id, card]);
      fragment.appendChild(card);
    });

    fragment.appendChild(MessageCard.create({ count: value?.length }));

    this.#list.replaceChildren(fragment);
  }

  /**
   * Replaces the list with an error message when job loading fails.
   */
  showError() {
    this.#jobs = [];
    this.#list.replaceChildren(MessageCard.create({ message: "Error" }));
  }

  /**
   * Displays a loading state while job results are being fetched.
   */
  showLoading() {
    this.#jobs = [];
    this.#list.replaceChildren(MessageCard.create({ message: "Loading" }));
  }

  #selectCard(selectedId: string) {
    if (!selectedId) return;
    this.#onSelect?.(selectedId);
    this.#jobs.forEach(([id, card]) => {
      card.isSelected = id === selectedId;
    });
  }
}

ComponentBase.register(tag, Results);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Results;
  }
}
