import type { JobModel } from "../../api/jobModel.ts";
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
  cards: JobCard[] = [];
  #onSelect?: (jobId: string) => void;
  #selectedId?: string;

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
  async init({ onSelect }: Props) {
    this.#onSelect = onSelect;
    this.#selectedId = undefined;
    await this.updateJobs(undefined);
  }

  /**
   * Rebuilds the job list display from the provided dataset.
   * @param value - Array of job models to render, or undefined to clear the list.
   */
  async updateJobs(value: JobModel[] | undefined, isSavedJob = false) {
    const hasJobs = Boolean(value?.length);
    const selectedId = hasJobs
      ? this.#selectedId ?? value?.[0]?.id
      : undefined;
    this.#selectedId = selectedId;

    const onClick = (id: string) => this.#selectCard(id);

    this.cards = await Promise.all(
      (value ?? []).map((job) => {
        const isSelected = job.id === selectedId;
        return JobCard.create({ job, isSelected, onClick });
      })
    );

    const displayCards: Node[] = [...this.cards];
    if (!isSavedJob) {
      displayCards.push(MessageCard.create({ count: value?.length }));
    } else if (!value?.length) {
      displayCards.push(MessageCard.create({ message: "NoSavedJob" }));
    }

    this.#list.replaceChildren(...displayCards);
  }

  /**
   * Replaces the list with an error message when job loading fails.
   */
  showError() {
    this.cards = [];
    this.#selectedId = undefined;
    this.#list.replaceChildren(MessageCard.create({ message: "Error" }));
  }

  /**
   * Displays a loading state while job results are being fetched.
   */
  showLoading() {
    this.cards = [];
    this.#selectedId = undefined;
    this.#list.replaceChildren(MessageCard.create({ message: "Loading" }));
  }

  #selectCard(selectedId: string) {
    if (!selectedId) return;
    this.#selectedId = selectedId;
    this.#onSelect?.(selectedId);
    this.cards.forEach((card) => {
      card.isSelected = card.jobId === selectedId;
    });
  }
}

ComponentBase.register(tag, Results);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Results;
  }
}
