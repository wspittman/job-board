import { JobResult } from "../../src/ats/ashby/jobResult";

export function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    id: "job-1",
    title: "SOFTWARE ENGINEER",
    department: "Engineering",
    team: "Platform",
    employmentType: "FullTime",
    location: "Remote",
    secondaryLocations: ["Seattle"],
    publishedAt: "2026-01-02T03:04:05.000Z",
    isListed: true,
    isRemote: true,
    workplaceType: "Remote",
    address: {
      postalAddress: {
        addressRegion: "WA",
        addressCountry: "US",
        addressLocality: "Seattle",
      },
    },
    jobUrl: "https://jobs.example.com/job-1",
    applyUrl: "https://jobs.example.com/job-1/apply",
    descriptionHtml:
      "<p>Build <strong>things</strong>.</p><script>bad()</script>",
    descriptionPlain: "Build things.",
    compensation: {
      compensationTierSummary: "$100k-$120k",
      scrapeableCompensationSalarySummary: "$100k-$120k",
      compensationTiers: [],
      summaryComponents: [],
    },
    ...overrides,
  };
}
