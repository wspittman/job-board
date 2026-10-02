import { JobResult } from "../../src/ats/leverFormat";

export function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    id: "job-1",
    createdAt: Date.parse("2026-03-04T05:06:07.000Z"),
    applyUrl: "https://jobs.example.com/job-1/apply",
    text: "SOFTWARE ENGINEER",
    description: "Opening",
    additional: "<p>More</p>",
    salaryDescription: "<p>$100k</p>",
    lists: [{ text: "Responsibilities", content: "<li>Build</li>" }],
    categories: {
      commitment: "Full-time",
      location: "Remote",
      team: "Platform",
      department: "Engineering",
      allLocations: ["Seattle", "Remote"],
    },
    country: "US",
    workplaceType: "remote",
    salaryRange: {
      currency: "USD",
      interval: "year",
      min: 100_000,
      max: 120_000,
    },
    ...overrides,
  };
}
