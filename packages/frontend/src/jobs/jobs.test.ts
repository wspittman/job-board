import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { FilterModel } from "../api/filterModel";
import { mockApi } from "../utils/testSetup";
import { mockJobs, type XrayComponent } from "../utils/testUtils";
import { FILTERS_UPDATED } from "./filters/filters";
import { JOB_CARD_SELECTED } from "./results/job-card";

// Import sub-components to trigger custom element registration before DOM setup
import "./details/details";
import "./filters/filters";
import "./results/results";

suite("jobs", () => {
  beforeAll(async () => {
    document.body.innerHTML = `
      <button id="action-button"></button>
      <jobs-filters></jobs-filters>
      <jobs-results></jobs-results>
      <jobs-details></jobs-details>
    `;
    await import("./jobs");
  });

  afterAll(() => {
    document.body.innerHTML = "";
  });

  test("FILTERS_UPDATED event triggers api.fetchJobs with the filter query", async () => {
    const filters = FilterModel.fromLocationSearchString("title=engineer");
    window.dispatchEvent(new CustomEvent(FILTERS_UPDATED, { detail: filters }));

    await Promise.resolve();

    expect(mockApi.fetchJobs).toHaveBeenCalledTimes(1);
  });

  test("JOB_CARD_SELECTED updates the details pane with the selected job title", async () => {
    mockJobs();
    const filters = FilterModel.fromLocationSearchString("title=engineer");
    window.dispatchEvent(new CustomEvent(FILTERS_UPDATED, { detail: filters }));

    await Promise.resolve();

    window.dispatchEvent(
      new CustomEvent(JOB_CARD_SELECTED, { detail: "job-1" }),
    );

    await Promise.resolve();

    const detailsEl = document.querySelector(
      "jobs-details",
    ) as unknown as XrayComponent;
    expect(detailsEl.getEl("title")?.textContent).toBe("Software Engineer");
  });
});
