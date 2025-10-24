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

const exploreFilters = document.querySelector("explore-filters")!;
exploreFilters.init({ onChange: onFilterChange });

const exploreResults = document.querySelector("explore-results")!;
exploreResults.init({ onSelect: onJobSelect });

const exploreDetails = document.querySelector("explore-details")!;

const jobMap = new Map<string, JobModel>();

async function onFilterChange(filters: FilterModel) {
  if (isEmptyFilterModel(filters)) {
    exploreResults.jobs = [emptyPlaceholder];
    exploreDetails.job = undefined;
    exploreDetails.hide();
    return;
  }

  const jobs = await api.fetchJobs(filters);

  if (!jobs.length) {
    exploreResults.jobs = [noMatchPlaceholder];
    exploreDetails.job = undefined;
    exploreDetails.hide();
    return;
  }

  jobMap.clear();
  for (const job of jobs) {
    jobMap.set(job.id, job);
  }

  exploreResults.jobs = jobs;
  exploreDetails.job = jobs[0];
  exploreDetails.show();
}

function onJobSelect(jobId: string) {
  exploreDetails.job = jobMap.get(jobId);
}

onFilterChange({});
