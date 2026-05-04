import { expect, suite, test, vi } from "vitest";
import type { JobModel } from "../api/jobModel";
import type { XrayComponent } from "../utils/testUtils";
import { JobChips } from "./job-chips";

type Xray = XrayComponent<JobChips>;

function makeJob(facets: string[]): JobModel {
  return { getDisplayFacets: vi.fn(() => facets) } as unknown as JobModel;
}

suite("JobChips", () => {
  test("renders a chip for each facet", () => {
    const element = document.createElement("jb-job-chips") as Xray;
    const job = makeJob(["Remote", "Full-time", "Engineering"]);
    const container = element.init({ job });
    expect(container.children).toHaveLength(3);
  });

  test("chip labels match facet strings", () => {
    const element = document.createElement("jb-job-chips") as Xray;
    const facets = ["Seattle, WA", "Engineering"];
    const container = element.init({ job: makeJob(facets) });
    const labels = Array.from(container.children).map(
      (c) => (c as unknown as Xray).getEl("label")?.textContent,
    );
    expect(labels).toEqual(facets);
  });

  test("passes useShort=true to getDisplayFacets", () => {
    const element = document.createElement("jb-job-chips") as Xray;
    const job = makeJob(["Remote"]);
    element.init({ job, useShort: true });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(job.getDisplayFacets)).toHaveBeenCalledWith(true);
  });

  test("re-init replaces previous chips", () => {
    const element = document.createElement("jb-job-chips") as Xray;
    element.init({ job: makeJob(["Remote", "Full-time"]) });
    const container = element.init({ job: makeJob(["Part-time"]) });
    expect(container.children).toHaveLength(1);
  });
});
