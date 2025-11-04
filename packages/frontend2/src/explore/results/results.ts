import type { JobModel } from "../../api/apiTypes";
import { ComponentBase } from "../../components/componentBase";
import type { JobCard } from "./job-card";
import "./job-card.ts";
import { MessageCard } from "./message-card.ts";
import css from "./results.css?raw";
import html from "./results.html?raw";

const tag = "explore-results";
const cssSheet = ComponentBase.createCSSSheet(css);

interface Props {
  onSelect?: (jobId: string) => void;
}

export class Results extends ComponentBase {
  #list: HTMLElement;
  #jobs: [string, JobCard][] = [];
  #onSelect?: (jobId: string) => void;

  constructor() {
    super(html, cssSheet);
    this.#list = this.getEl("list")!;
  }

  init({ onSelect }: Props) {
    this.#onSelect = onSelect;
    this.jobs = undefined;
  }

  set jobs(value: JobModel[] | undefined) {
    this.#jobs = [];
    const fragment = document.createDocumentFragment();
    const onClick = (id: string) => this.#selectCard(id);

    value?.forEach((job, index) => {
      const isSelected = index === 0;
      const card = document.createElement("explore-job-card");
      card.init({ job, isSelected, onClick });
      this.#jobs.push([job.id, card]);
      fragment.appendChild(card);
    });

    fragment.appendChild(MessageCard.create({ count: value?.length }));

    this.#list.replaceChildren(fragment);
  }

  showError() {
    this.#jobs = [];
    this.#list.replaceChildren(MessageCard.create({ message: "Error" }));
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
