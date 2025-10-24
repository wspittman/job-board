import "../sharedStyles/all.css";
import "./explore.css";

import "./details/details.ts";
import "./filters/filters.ts";
import "./results/results.ts";

import { api } from "../api/api.ts";
import type { FilterModel, JobModel } from "../api/apiTypes.ts";

const exploreFilters = document.querySelector("explore-filters")!;
exploreFilters.init({ onChange: onFilterChange });

const exploreResults = document.querySelector("explore-results")!;
exploreResults.init({ onSelect: onJobSelect });

const exploreDetails = document.querySelector("explore-details")!;

const jobMap = new Map<string, JobModel>();

async function onFilterChange(filters: FilterModel) {
  const jobs = await api.fetchJobs(filters);

  jobMap.clear();
  for (const job of jobs) {
    jobMap.set(job.id, job);
  }

  exploreResults.jobs = jobs;
  exploreDetails.job = jobs[0];
}

function onJobSelect(jobId: string) {
  exploreDetails.job = jobMap.get(jobId);
}
