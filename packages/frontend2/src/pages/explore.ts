import "../components/explore-details.ts";
import "../sharedStyles/all.css";
import "./explore.css";

import { api } from "../api/api";
import type { Filters, Job } from "../api/apiTypes";

const jobEntries: Job[] = await api.fetchJobs({});

const jobMap = new Map(jobEntries.map((job) => [job.id, job] as const));
const jobCards = new Map<string, HTMLButtonElement>();

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
const detailSection = document.querySelector<HTMLElement>("[data-job-detail]");
const detailTitle = detailSection?.querySelector<HTMLElement>(
  "[data-detail-title]"
);
const detailMeta =
  detailSection?.querySelector<HTMLElement>("[data-detail-meta]");
const detailBody =
  detailSection?.querySelector<HTMLElement>("[data-detail-body]");

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

const getDescriptionParagraphs = (description: string) =>
  description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const getSummaryFromJob = (job: Job) => {
  if (job.facets?.summary) {
    return job.facets.summary;
  }

  const [firstParagraph] = getDescriptionParagraphs(job.description);
  return firstParagraph ?? "";
};

const formatPostedDate = (postTS: number) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - postTS;
  const days = Math.max(0, Math.round(elapsed / millisecondsPerDay));

  if (days === 0) {
    return "Posted today";
  }

  if (days === 1) {
    return "Posted 1 day ago";
  }

  return `Posted ${days} days ago`;
};

function updateDetail(jobId: string) {
  const job = jobMap.get(jobId);

  if (!job || !detailTitle || !detailMeta || !detailBody) {
    return;
  }

  detailTitle.textContent = `${job.title} at ${job.company}`;

  const metaParts = [
    job.location,
    job.isRemote ? "Remote" : "Onsite",
    formatPostedDate(job.postTS),
  ];
  detailMeta.textContent = metaParts.join(" · ");

  detailBody.innerHTML = "";
  getDescriptionParagraphs(job.description).forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    detailBody.appendChild(paragraph);
  });
}

function selectCard(selectedId: string) {
  jobCards.forEach((card, id) => {
    const isActive = id === selectedId;
    card.classList.toggle("is-selected", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function showJob(jobId: string) {
  selectCard(jobId);
  updateDetail(jobId);

  const deets = document.querySelector<HTMLElement>("explore-details");
  if (deets) {
    (deets as any).job = jobMap.get(jobId);
  }
}

const renderJobCard = (job: Job, isSelected: boolean) => {
  const card = document.createElement("button");
  card.className = "job-card";
  card.type = "button";
  card.dataset["jobCard"] = job.id;
  card.setAttribute("role", "listitem");
  card.classList.toggle("is-selected", isSelected);
  card.setAttribute("aria-pressed", String(isSelected));

  const title = document.createElement("h3");
  title.className = "job-card__title";
  title.textContent = job.title;
  card.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "job-card__meta";
  meta.textContent = `${job.company} · ${job.location}`;
  card.appendChild(meta);

  const summary = document.createElement("p");
  summary.className = "job-card__summary";
  summary.textContent = getSummaryFromJob(job);
  card.appendChild(summary);

  card.addEventListener("click", () => {
    showJob(job.id);
  });

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
  showJob(initialId);
}
