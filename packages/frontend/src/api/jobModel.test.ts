import { expect, suite, test, vi } from "vitest";
import { createJobModel } from "../utils/testUtils";
import type { JobModelApi } from "./apiTypes";

vi.mock("../utils/storage", () => ({
  getStorageIds: vi.fn(() => ({ visitorId: "v1", sessionId: "s1" })),
}));

suite("JobModel", () => {
  test("getDisplayDetail: returns title, company (friendly name), and summary", () => {
    const job = createJobModel({ facets: { summary: "Great opportunity" } });

    const detail = job.getDisplayDetail();
    expect(detail.title).toBe("Software Engineer");
    expect(detail.company).toBe("Acme");
    expect(detail.summary).toBe("Great opportunity");
  });

  test("getDisplayDetail: falls back to raw company name when friendly name is not found", () => {
    const job = createJobModel({ company: "unknown-corp" });
    expect(job.getDisplayDetail().company).toBe("unknown-corp");
  });

  test("getDisplayDetail: summary is undefined when facets are absent", () => {
    const job = createJobModel();
    expect(job.getDisplayDetail().summary).toBeUndefined();
  });

  test.for([
    ["Seattle, WA", { location: "Seattle, WA" }],
    ["Remote", { isRemote: true }],
    ["Engineering", { jobFamily: "engineering" }],
    ["Full-time", { workTimeBasis: "full_time" }],
    ["Series A Company", { companyStage: "series_a" }],
  ] as [string, Partial<JobModelApi>][])(
    "getDisplayFacets (useShort=false): includes '%s'",
    ([expected, overrides]) => {
      const job = createJobModel(overrides);
      expect(job.getDisplayFacets(false)).toContain(expected);
    },
  );

  test("getDisplayFacets (useShort=false): includes salary with cadence", () => {
    const job = createJobModel({
      minSalary: 120000,
      payCadence: "salary",
    });
    const facets = job.getDisplayFacets(false);
    expect(
      facets.find((f) => f.includes("120") || f.includes("Year")),
    ).toBeDefined();
  });

  test("getDisplayFacets (useShort=false): includes experience in long form", () => {
    const job = createJobModel({ facets: { experience: 3 } });
    expect(job.getDisplayFacets(false)).toContain(
      "3 years experience required",
    );
  });

  test("getDisplayFacets (useShort=true): trims city suffix from location", () => {
    const job = createJobModel();
    const facets = job.getDisplayFacets(true);
    expect(facets).toContain("Seattle");
    expect(facets).not.toContain("Seattle, WA");
  });

  test("getDisplayFacets (useShort=true): includes 'Remote' unchanged", () => {
    const job = createJobModel({ isRemote: true });
    expect(job.getDisplayFacets(true)).toContain("Remote");
  });

  test("getDisplayFacets (useShort=true): recent post label present", () => {
    expect(createJobModel().getDisplayFacets(true)).toContain("Past Week");
  });

  test("getDisplayFacets (useShort=true): stage label has no 'Company' suffix", () => {
    const facets = createJobModel({ companyStage: "seed" }).getDisplayFacets(
      true,
    );
    expect(facets).toContain("Seed");
    expect(facets.some((f) => f.includes("Company"))).toBe(false);
  });

  test("getDisplayFacets (useShort=true): experience in short form", () => {
    expect(
      createJobModel({ facets: { experience: 5 } }).getDisplayFacets(true),
    ).toContain("5 yrs exp");
  });

  test("applyUrl: prepends /api and appends storage id query params", () => {
    const url = createJobModel().applyUrl;
    expect(url).toMatch(/^\/api\/jobs\/job-1\/apply\?ats=gh/);
    expect(url).toContain("visitorId=v1");
    expect(url).toContain("sessionId=s1");
  });

  test("bookmarkUrl: constructs correct URL from location.origin and pathname", () => {
    const url = createJobModel().bookmarkUrl;
    expect(url).toContain("companyId=acme");
    expect(url).toContain("jobId=job-1");
  });
});
