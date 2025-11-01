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

function infoMessage(jobCount?: number): [string, string, string] {
  switch (jobCount ?? -1) {
    case -1:
      return [
        "Add Filters To Begin",
        "Try to have fun with it!",
        "As you apply filters, jobs will begin appearing here. We'll return the first 24 matches we find for your filter set. You can always adjust your filters until you have a great set of matches.",
      ];
    case 0:
      return [
        "No Matches Found",
        "Try adjusting your filters.",
        "You may need to loosen your filters to find matches. Or maybe we don't have good jobs posted for you yet. =(",
      ];
    case 24:
      return [
        "24 Matches Shown",
        "More are available!",
        "By adjusting your filters you can narrow down the results until you have only the best matches for you.",
      ];
    default:
      return [
        "All Matches Shown",
        "Are these great matches?",
        "If these are great matches, bookmark this page to rerun the search later. New jobs are being posted every day! If the matches aren't quite right, try adjusting your filters until they are.",
      ];
  }
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

    fragment.appendChild(this.#getInfoCard(value?.length));

    this.#list.replaceChildren(fragment);
  }

  showError(message: string) {
    this.#jobs = [];
    const fragment = document.createDocumentFragment();

    const errorCard = document.createElement("div");
    errorCard.className = "error-card";
    errorCard.setAttribute("role", "alert");

    const titleEl = document.createElement("strong");
    titleEl.textContent = "⚠️ Well that's not better!";
    const messageEl = document.createElement("span");
    messageEl.textContent = message;

    errorCard.append(titleEl, messageEl);
    fragment.appendChild(errorCard);

    this.#list.replaceChildren(fragment);
  }

  #selectCard(selectedId: string) {
    if (!selectedId) return;
    this.#onSelect?.(selectedId);
    this.#jobs.forEach(([id, card]) => {
      card.isSelected = id === selectedId;
    });
  }

  #getInfoCard(jobCount?: number): JobCard {
    const [title, company, summary] = infoMessage(jobCount);
    const card = document.createElement("explore-job-card");
    card.init({ job: { title, company, facets: { summary } } as JobModel });
    return card;
  }
}

ComponentBase.register(tag, Results);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: Results;
  }
}
