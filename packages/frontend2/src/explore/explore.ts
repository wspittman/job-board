import "../sharedStyles/all.css";
import "./details/details.ts";
import "./explore.css";
import "./filters/filters.ts";
import "./results/job-card.ts";

import { api } from "../api/api.ts";
import type { JobModel } from "../api/apiTypes.ts";
import type { Filters } from "./filters/filters.ts";
import type { JobCard } from "./results/job-card.ts";

const exploreFilters = document.querySelector<Filters>("explore-filters")!;
exploreFilters.init({
  onChange: (filters) => {
    console.log("Filters changed");
    console.log(filters);
    // api.fetchJobs goes here
  },
});

const jobEntries: JobModel[] = await api.fetchJobs({});

const jobMap = new Map(jobEntries.map((job) => [job.id, job] as const));
const jobCards = new Map<string, JobCard>();

const resultsList = document.querySelector<HTMLElement>("[data-results-list]");

function selectCard(selectedId: string) {
  jobCards.forEach((card, id) => {
    card.isSelected = id === selectedId;
  });

  const deets = document.querySelector("explore-details");
  if (deets) {
    deets.job = jobMap.get(selectedId);
  }
}

const renderJobCard = (job: JobModel, isSelected: boolean) => {
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
