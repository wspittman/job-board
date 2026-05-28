import type { JobModel } from "../../api/jobModel.ts";
import { ComponentBase } from "../../components/componentBase.ts";
import { JobCard } from "./job-card.ts";
import { MessageCard } from "./message-card.ts";

import css from "./results.css?raw";
import html from "./results.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jobs-results";

/**
 * Custom element responsible for rendering job results and coordinating selection events.
 */
export class Results extends ComponentBase {
  #listEl: HTMLElement;
  #cards: JobCard[] = [];
  #selectedCard?: JobCard;

  /**
   * Initializes the results list container and associated template.
   */
  constructor() {
    super(html, cssSheet, { byoc: true });
    this.#listEl = this.getEl("list")!;
    this.updateJobs(undefined);
  }

  /**
   * Rebuilds the job list display from the provided dataset.
   * @param value - Array of job models to render, or undefined to clear the list.
   */
  updateJobs(value: JobModel[] | undefined, isSavedJob = false) {
    this.#clearCards();

    this.#cards = (value ?? []).map((job, index) => {
      const isSelected = index === 0;
      return JobCard.create({ job, isSelected });
    });

    this.#selectedCard = this.#cards.at(0);

    const displayCards: Node[] = [...this.#cards];
    if (!isSavedJob) {
      displayCards.push(MessageCard.create({ count: value?.length }));
    } else if (!value?.length) {
      displayCards.push(MessageCard.create({ message: "NoSavedJob" }));
    }

    this.#listEl.replaceChildren(...displayCards);
  }

  /**
   * Replaces the list with an error message when job loading fails.
   */
  showError() {
    this.#clearCards();
    this.#listEl.replaceChildren(MessageCard.create({ message: "Error" }));
  }

  /**
   * Displays a loading state while job results are being fetched.
   */
  showLoading() {
    this.#clearCards();
    this.#listEl.replaceChildren(MessageCard.create({ message: "Loading" }));
  }

  #clearCards() {
    this.#cards = [];
    this.#selectedCard = undefined;
  }

  selectCard(selectedId: string) {
    if (!selectedId) return;

    if (this.#selectedCard?.jobId === selectedId) return;

    if (this.#selectedCard) {
      this.#selectedCard.isSelected = false;
    }

    this.#selectedCard = this.#cards.find((card) => card.jobId === selectedId);

    if (this.#selectedCard) {
      this.#selectedCard.isSelected = true;
    }
  }
}

ComponentBase.register(tag, Results);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Results;
  }
}
