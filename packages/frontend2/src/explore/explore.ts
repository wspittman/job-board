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

const panes = {
  filters: document.querySelector("explore-filters")!,
  results: document.querySelector("explore-results")!,
  details: document.querySelector("explore-details")!,
};
type Pane = keyof typeof panes;

panes.filters.init({ onChange: onFilterChange, initialFilters });
panes.results.init({ onSelect: onJobSelect });

let activePane: Pane = "results";
const jobMap = new Map<string, JobModel>();
let lastRequestId = 0;

async function onFilterChange(filters: FilterModel) {
  updateQueryString(filters);
  const requestId = ++lastRequestId;

  if (filters.isEmpty()) {
    panes.results.jobs = undefined;
    jobDeselect();
    return;
  }

  try {
    const jobs = await api.fetchJobs(filters);

    if (requestId !== lastRequestId) {
      return;
    }

    if (!jobs.length) {
      panes.results.jobs = [];
      jobDeselect();
      return;
    }

    jobMap.clear();
    for (const job of jobs) {
      jobMap.set(job.id, job);
    }

    panes.results.jobs = jobs;
    panes.details.job = jobMap.get(jobs[0]!.id);
    panes.details.toggleAttribute("empty", false);
  } catch (error) {
    if (requestId !== lastRequestId) {
      return;
    }

    jobMap.clear();
    panes.results.showError();
    jobDeselect();
  }
}

function jobDeselect() {
  panes.details.job = undefined;
  panes.details.toggleAttribute("empty", true);
}

function onJobSelect(jobId: string) {
  panes.details.job = jobMap.get(jobId);
  setActivePane("details");
}

function onActionClick() {
  const nextPane = activePane === "results" ? "filters" : "results";
  setActivePane(nextPane);
}

function updateQueryString(filters: FilterModel) {
  const query = filters.toUrlSearchParams().toString();
  const newUrl = query ? `${location.pathname}?${query}` : location.pathname;
  history.replaceState({}, "", newUrl);
}

function setActivePane(nextPane: Pane) {
  for (const [pane, element] of Object.entries(panes)) {
    element.toggleAttribute("inactive", pane !== nextPane);
  }

  const isResultsPane = nextPane === "results";
  const buttonLabel = isResultsPane ? "Show Filters" : "Close";

  actionButton.toggleAttribute("close", !isResultsPane);
  actionButton.textContent = buttonLabel;

  activePane = nextPane;
}

setActivePane("results");
jobDeselect();
