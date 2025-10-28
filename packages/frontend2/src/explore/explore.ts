import "../sharedStyles/all.css";
import "./explore.css";

import "./details/details.ts";
import "./filters/filters.ts";
import "./results/results.ts";

import { api } from "../api/api.ts";
import type { FilterModel, JobModel } from "../api/apiTypes.ts";
import { isEmptyFilterModel } from "../api/filterModelUtils.ts";

const emptyPlaceholder = {
  title: "Add Filters To Begin",
  company: "Try to have fun with it!",
  facets: {
    summary:
      "As you apply filters, jobs will begin appearing here. We'll return the first 24 matches we find for your filter set. You can always adjust your filters until you have a great set of matches.",
  },
} as JobModel;

const noMatchPlaceholder = {
  title: "No Matches Found",
  company: "Try adjusting your filters.",
  facets: {
    summary:
      "Consider broadening your criteria to see more results. Or maybe we don't have good jobs posted for you yet. =(",
  },
} as JobModel;

const actionButton = document.getElementById("action-button")!;
actionButton.addEventListener("click", onActionClick);

const exploreFilters = document.querySelector("explore-filters")!;
exploreFilters.init({ onChange: onFilterChange });

const exploreResults = document.querySelector("explore-results")!;
exploreResults.init({ onSelect: onJobSelect });

const exploreDetails = document.querySelector("explore-details")!;

const jobMap = new Map<string, JobModel>();
let lastRequestId = 0;

async function onFilterChange(filters: FilterModel) {
  const requestId = ++lastRequestId;

  if (isEmptyFilterModel(filters)) {
    exploreResults.jobs = [emptyPlaceholder];
    jobDeselect();
    return;
  }

  const jobs = await api.fetchJobs(filters);

  if (requestId !== lastRequestId) {
    return;
  }

  if (!jobs.length) {
    exploreResults.jobs = [noMatchPlaceholder];
    jobDeselect();
    return;
  }

  jobMap.clear();
  for (const job of jobs) {
    jobMap.set(job.id, job);
  }

  exploreResults.jobs = jobs;
  exploreDetails.job = jobMap.get(jobs[0]!.id);
  exploreDetails.toggleAttribute("empty", false);
}

function jobDeselect() {
  exploreDetails.job = undefined;
  exploreDetails.toggleAttribute("empty", true);
}

function onJobSelect(jobId: string) {
  exploreDetails.job = jobMap.get(jobId);
  actionButton.toggleAttribute("close", true);
  actionButton.textContent = "Close";
  activeDetails();
}

function onActionClick() {
  const openFilters = actionButton.toggleAttribute("close");

  if (openFilters) {
    actionButton.textContent = "Close";
    activeFilters();
  } else {
    actionButton.textContent = "Show Filters";
    activeResults();
  }
}

function activeFilters() {
  exploreFilters.toggleAttribute("inactive", false);
  exploreResults.toggleAttribute("inactive", true);
  exploreDetails.toggleAttribute("inactive", true);
}

function activeResults() {
  exploreFilters.toggleAttribute("inactive", true);
  exploreResults.toggleAttribute("inactive", false);
  exploreDetails.toggleAttribute("inactive", true);
}

function activeDetails() {
  exploreFilters.toggleAttribute("inactive", true);
  exploreResults.toggleAttribute("inactive", true);
  exploreDetails.toggleAttribute("inactive", false);
}

activeResults();
onFilterChange({});
