import "../sharedStyles/all.css";
import "./explore.css";

import "./details/details.ts";
import "./filters/filters.ts";
import "./results/results.ts";

import { FilterModel } from "../api/filterModel.ts";
import { JobModel } from "../api/jobModel.ts";

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

let activePane: Pane = initialFilters.isEmpty() ? "filters" : "results";
const jobMap = new Map<string, JobModel>();
let lastRequestId = 0;

/**
 * Handles filter updates by syncing the URL, fetching jobs, and updating the UI panels.
 * @param filters - The current set of filters emitted by the filters pane.
 */
async function onFilterChange(filters: FilterModel) {
  updateQueryString(filters);
  const requestId = ++lastRequestId;

  if (filters.isEmpty()) {
    await panes.results.updateJobs(undefined);
    await jobDeselect();
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

    if (!jobs.length) {
      await panes.results.updateJobs([], isSavedJob);
      await jobDeselect();
      return;
    }

    jobMap.clear();
    for (const job of jobs) {
      jobMap.set(job.id, job);
    }

    await panes.results.updateJobs(jobs, isSavedJob);
    await panes.details.updateJob(jobMap.get(jobs[0]!.id));
    panes.details.toggleAttribute("empty", false);
  } catch (error) {
    if (requestId !== lastRequestId) {
      return;
    }

    jobMap.clear();
    panes.results.showError();
    await jobDeselect();
  }
}

/**
 * Clears the active job selection and marks the details pane as empty.
 */
async function jobDeselect() {
  await panes.details.updateJob(undefined);
  panes.details.toggleAttribute("empty", true);
}

/**
 * Sets the selected job in the details pane and focuses the details view.
 * @param jobId - Identifier of the job chosen from the results list.
 */
async function onJobSelect(jobId: string) {
  await panes.details.updateJob(jobMap.get(jobId));
  setActivePane("details");
}

/**
 * Toggles between the filters and results panes when the primary action button is pressed.
 */
function onActionClick() {
  const nextPane = activePane === "results" ? "filters" : "results";
  setActivePane(nextPane);
}

/**
 * Updates the browser query string to reflect the current filters without reloading the page.
 * @param filters - Filter set to serialize into the URL.
 */
function updateQueryString(filters: FilterModel) {
  const query = filters.toUrlSearchParams().toString();
  const newUrl = query ? `${location.pathname}?${query}` : location.pathname;
  history.replaceState({}, "", newUrl);
}

/**
 * Applies the active pane state by toggling attributes and updating the action button label.
 * @param nextPane - The pane identifier that should become active.
 */
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

setActivePane(activePane);
jobDeselect();
