import "../sharedStyles/all.css";
import "./explore.css";

import "./details/details.ts";
import "./filters/filters.ts";
import "./results/results.ts";

import { api } from "../api/api.ts";
import type { JobModel } from "../api/apiTypes.ts";
import { FilterModel } from "../api/filterModel.ts";

const actionButton = document.getElementById("action-button")!;
actionButton.addEventListener("click", onActionClick);

const initialFilters = FilterModel.fromUrlSearchParams(
  new URLSearchParams(location.search)
);
const exploreFilters = document.querySelector("explore-filters")!;
exploreFilters.init({ onChange: onFilterChange, initialFilters });

const exploreResults = document.querySelector("explore-results")!;
exploreResults.init({ onSelect: onJobSelect });

const exploreDetails = document.querySelector("explore-details")!;

const jobMap = new Map<string, JobModel>();
let lastRequestId = 0;

async function onFilterChange(filters: FilterModel) {
  updateQueryString(filters);
  const requestId = ++lastRequestId;

  if (filters.isEmpty()) {
    exploreResults.jobs = undefined;
    jobDeselect();
    return;
  }

  try {
    const jobs = await api.fetchJobs(filters);

    if (requestId !== lastRequestId) {
      return;
    }

    if (!jobs.length) {
      exploreResults.jobs = [];
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
  } catch (error) {
    if (requestId !== lastRequestId) {
      return;
    }

    jobMap.clear();
    exploreResults.showError(
      "Unable to load job data. Please try again later."
    );
    jobDeselect();
    console.error("Failed to load jobs", error);
  }
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

function updateQueryString(filters: FilterModel) {
  const query = filters.toUrlSearchParams().toString();
  const newUrl = query ? `${location.pathname}?${query}` : location.pathname;
  history.replaceState({}, "", newUrl);
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
jobDeselect();
