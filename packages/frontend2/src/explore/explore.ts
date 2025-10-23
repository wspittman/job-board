import "../sharedStyles/all.css";
import "./details/details.ts";
import "./explore.css";
import "./filters/filters.ts";
import "./results/job-card.ts";

import { api } from "../api/api.ts";
import type { Filters, Job } from "../api/apiTypes.ts";
import type { JobCard } from "./results/job-card.ts";

const jobEntries: Job[] = await api.fetchJobs({});

const jobMap = new Map(jobEntries.map((job) => [job.id, job] as const));
const jobCards = new Map<string, JobCard>();

const resultsList = document.querySelector<HTMLElement>("[data-results-list]");
const filtersElement = document.querySelector<HTMLElement>("[data-filters]");
const filterToggle = document.querySelector<HTMLButtonElement>(
  "[data-filters-toggle]"
);
const filtersForm = document.querySelector<HTMLFormElement>(
  "#explore-filter-content"
);

const buildFilters = (): Filters => {
  const filters: Filters = {};

  if (!filtersForm) {
    return filters;
  }

  const formData = new FormData(filtersForm);
  const titleValue = (formData.get("title") as string | null)?.trim();

  if (titleValue) {
    filters.title = titleValue;
  }

  const postedRaw = formData.get("posted");

  if (typeof postedRaw === "string") {
    const trimmedPosted = postedRaw.trim();

    if (trimmedPosted) {
      const days = Number.parseInt(trimmedPosted, 10);

      if (!Number.isNaN(days)) {
        filters.daysSince = days;
      }
    }
  }

  const remoteValue = formData.get("remote");

  if (remoteValue === "remote") {
    filters.isRemote = true;
  } else if (remoteValue === "hybrid") {
    filters.isRemote = false;
  }

  return filters;
};

const handleFiltersChange = () => {
  const filters = buildFilters();
  void api.fetchJobs(filters);
};

filterToggle?.addEventListener("click", () => {
  if (!filtersElement) {
    return;
  }

  const isOpen = filtersElement.dataset["state"] !== "closed";
  const nextState = isOpen ? "closed" : "open";
  filtersElement.dataset["state"] = nextState;
  filterToggle.setAttribute("aria-expanded", String(nextState === "open"));
});

if (filtersForm) {
  filtersForm.addEventListener("input", handleFiltersChange);
  filtersForm.addEventListener("change", handleFiltersChange);
}

function selectCard(selectedId: string) {
  jobCards.forEach((card, id) => {
    card.isSelected = id === selectedId;
  });

  const deets = document.querySelector("explore-details");
  if (deets) {
    deets.job = jobMap.get(selectedId);
  }
}

const renderJobCard = (job: Job, isSelected: boolean) => {
  const card = document.createElement("explore-job-card");
  card.init({ job, isSelected, onClick: selectCard });

  jobCards.set(job.id, card);

  return card;
};

if (resultsList) {
  jobEntries.forEach((job, index) => {
    const card = renderJobCard(job, index === 0);
    resultsList.appendChild(card);
  });
}

const initialId = jobEntries[0]?.id;

if (initialId) {
  selectCard(initialId);
}
