import type { JobModel } from "../../api/apiTypes";
import { ComponentBase } from "../../components/componentBase";
import type { JobCard } from "./job-card";
import "./job-card.ts";
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
  }

  set jobs(value: JobModel[]) {
    this.#jobs = [];
    this.#list.innerHTML = "";
    const onClick = (id: string) => this.#selectCard(id);

    value.forEach((job, index) => {
      const isSelected = index === 0;
      const card = document.createElement("explore-job-card");
      card.init({ job, isSelected, onClick });
      this.#jobs.push([job.id, card]);
      this.#list.appendChild(card);
    });
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
