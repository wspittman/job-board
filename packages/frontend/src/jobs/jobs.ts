import "../sharedStyles/all.css";
import "./jobs.css";

import "./details/details.ts";
import "./filters/filters.ts";
import "./results/results.ts";

import { FilterModel } from "../api/filterModel.ts";
import { JobModel } from "../api/jobModel.ts";
import { FILTERS_UPDATED } from "./filters/filters.ts";
import { JOB_CARD_SELECTED } from "./results/job-card.ts";

// Top-level state
const jobMap = new Map<string, JobModel>();
const initialFilters = FilterModel.fromLocationSearchString(location.search);
let activePane: Pane = initialFilters.isEmpty() ? "filters" : "results";
let lastRequestId = 0;

// #region Element references, initialization, and event handlers

const actionButton = document.getElementById("action-button")!;
actionButton.addEventListener("click", onActionClick);

const panes = {
  filters: document.querySelector("jobs-filters")!,
  results: document.querySelector("jobs-results")!,
  details: document.querySelector("jobs-details")!,
};
type Pane = keyof typeof panes;

panes.filters.init({ initialFilters });

addEventListener(JOB_CARD_SELECTED, (event) => {
  if (event instanceof CustomEvent) {
    onJobSelect(event.detail as string);
  }
});

addEventListener(FILTERS_UPDATED, (event) => {
  if (event instanceof CustomEvent) {
    void onFilterChange(event.detail as FilterModel);
  }
});

/**
 * Toggles between the filters and results panes when the primary action button is pressed.
 */
function onActionClick() {
  const nextPane = activePane === "results" ? "filters" : "results";
  setActivePane(nextPane);
}

/**
 * Sets the selected job in the details pane and focuses the details view.
 * @param jobId - Identifier of the job chosen from the results list.
 */
function onJobSelect(jobId: string) {
  panes.results.selectCard(jobId);
  panes.details.updateJob(jobMap.get(jobId));
  setActivePane("details");
}

// #endregion

/**
 * Handles filter updates by syncing the URL, fetching jobs, and updating the UI panels.
 * @param filters - The current set of filters emitted by the filters pane.
 */
async function onFilterChange(filters: FilterModel) {
  updateQueryString(filters);
  const requestId = ++lastRequestId;

  if (filters.isEmpty()) {
    setJobs();
    return;
  }

  try {
    const isSavedJob = filters.isSavedJob();
    panes.results.toggleAttribute("smallen", isSavedJob);
    panes.results.showLoading();
    const jobs = await JobModel.search(filters);

    if (requestId !== lastRequestId) {
      return;
    }

    setJobs(jobs, isSavedJob);
  } catch {
    if (requestId !== lastRequestId) {
      return;
    }

    setJobs();
    panes.results.showError();
  }
}

/**
 * Updates the browser query string to reflect the current filters without reloading the page.
 * @param filters - Filter set to serialize into the URL.
 */
function updateQueryString(filters: FilterModel) {
  const query = filters.toLocationSearchString();
  const newUrl = query ? `${location.pathname}?${query}` : location.pathname;
  history.replaceState({}, "", newUrl);
}

function setJobs(jobs?: JobModel[], isSavedJob = false) {
  jobMap.clear();
  for (const job of jobs ?? []) {
    jobMap.set(job.id, job);
  }

  const firstJob = jobs?.[0];

  panes.results.updateJobs(jobs, isSavedJob);
  panes.details.updateJob(firstJob);

  panes.details.toggleAttribute("empty", !firstJob);
  updateActionButton();
}

/**
 * Applies the active pane state by toggling attributes and updating the action button label.
 * @param nextPane - The pane identifier that should become active.
 */
function setActivePane(nextPane: Pane) {
  for (const [pane, element] of Object.entries(panes)) {
    element.toggleAttribute("inactive", pane !== nextPane);
  }

  activePane = nextPane;
  updateActionButton();
}

function updateActionButton() {
  actionButton.textContent = getActionButtonLabel();
  actionButton.toggleAttribute(
    "disabled",
    activePane === "filters" && !jobMap.size,
  );
}

function getActionButtonLabel() {
  switch (activePane) {
    case "filters":
      return `View ${jobMap.size} Jobs`;
    case "results":
      return "Show Filters";
    case "details":
      return "Back to Results";
  }
}

setActivePane(activePane);
setJobs();
