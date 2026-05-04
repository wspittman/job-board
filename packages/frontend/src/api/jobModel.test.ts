import { expect, suite, test, vi } from "vitest";
import type { JobModelApi } from "./apiTypes";
import { JobModel } from "./jobModel";

vi.mock("./metadataModel", () => ({
  metadataModel: {
    getCompanyFriendlyName: vi.fn((companyId) =>
      companyId === "acme-corp" ? "Acme Inc." : undefined,
    ),
  },
}));

vi.mock("../utils/storage", () => ({
  getStorageIds: vi.fn(() => ({ visitorId: "v1", sessionId: "s1" })),
}));

function makeJob(overrides: Partial<JobModelApi> = {}): JobModelApi {
  return {
    id: "job-1",
    companyId: "acme",
    title: "Software Engineer",
    company: "acme-corp",
    description: "A great job",
    postTS: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    applyUrl: "/jobs/job-1/apply",
    isRemote: false,
    location: "Seattle, WA",
    ...overrides,
  };
}

suite("JobModel", () => {
  test("getDisplayDetail: returns title, company (friendly name), and summary", () => {
    const job = new JobModel(
      makeJob({ facets: { summary: "Great opportunity" } }),
    );
    const detail = job.getDisplayDetail();
    expect(detail.title).toBe("Software Engineer");
    expect(detail.company).toBe("Acme Inc.");
    expect(detail.summary).toBe("Great opportunity");
  });

  test("getDisplayDetail: falls back to raw company name when friendly name is not found", () => {
    const job = new JobModel(makeJob({ company: "unknown-corp" }));
    expect(job.getDisplayDetail().company).toBe("unknown-corp");
  });

  test("getDisplayDetail: summary is undefined when facets are absent", () => {
    const job = new JobModel(makeJob({ facets: undefined }));
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
      const job = new JobModel(makeJob(overrides));
      expect(job.getDisplayFacets(false)).toContain(expected);
    },
  );

  test("getDisplayFacets (useShort=false): includes salary with cadence", () => {
    const job = new JobModel(
      makeJob({ minSalary: 120000, payCadence: "salary", currency: "USD" }),
    );
    const facets = job.getDisplayFacets(false);
    expect(
      facets.find((f) => f.includes("120") || f.includes("Year")),
    ).toBeDefined();
  });

  test("getDisplayFacets (useShort=false): includes experience in long form", () => {
    const job = new JobModel(makeJob({ facets: { experience: 3 } }));
    expect(job.getDisplayFacets(false)).toContain(
      "3 years experience required",
    );
  });

  test("getDisplayFacets (useShort=true): trims city suffix from location", () => {
    const job = new JobModel(makeJob({ location: "Seattle, WA" }));
    const facets = job.getDisplayFacets(true);
    expect(facets).toContain("Seattle");
    expect(facets).not.toContain("Seattle, WA");
  });

  test("getDisplayFacets (useShort=true): includes 'Remote' unchanged", () => {
    const job = new JobModel(makeJob({ isRemote: true }));
    expect(job.getDisplayFacets(true)).toContain("Remote");
  });

  test("getDisplayFacets (useShort=true): recent post label present", () => {
    const ts = Date.now() - 1000 * 60 * 60 * 24 * 20;
    expect(
      new JobModel(makeJob({ postTS: ts })).getDisplayFacets(true),
    ).toContain("Recent");
  });

  test("getDisplayFacets (useShort=true): stage label has no 'Company' suffix", () => {
    const facets = new JobModel(
      makeJob({ companyStage: "seed" }),
    ).getDisplayFacets(true);
    expect(facets).toContain("Seed");
    expect(facets.some((f) => f.includes("Company"))).toBe(false);
  });

  test("getDisplayFacets (useShort=true): experience in short form", () => {
    expect(
      new JobModel(makeJob({ facets: { experience: 5 } })).getDisplayFacets(
        true,
      ),
    ).toContain("5 yrs exp");
  });

  test("applyUrl: prepends /api and appends storage id query params", () => {
    const url = new JobModel(makeJob({ applyUrl: "/jobs/job-1/apply?ats=gh" }))
      .applyUrl;
    expect(url).toMatch(/^\/api\/jobs\/job-1\/apply\?ats=gh/);
    expect(url).toContain("visitorId=v1");
    expect(url).toContain("sessionId=s1");
  });

  test("bookmarkUrl: constructs correct URL from location.origin and pathname", () => {
    const url = new JobModel(makeJob({ companyId: "acme", id: "job-1" }))
      .bookmarkUrl;
    expect(url).toContain("companyId=acme");
    expect(url).toContain("jobId=job-1");
  });
});
