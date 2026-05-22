import { expect, suite, test } from "vitest";
import { fmt } from "../utils/format";
import { mockMetadata } from "../utils/testUtils";
import { metadataModel } from "./metadataModel";

suite("metadataModel", () => {
  test("getCountStrings: formats all count strings", async () => {
    mockMetadata();
    const result = await metadataModel.getCountStrings();

    expect(result.jobCount).toBe(fmt.number(1000));
    expect(result.recentJobCount).toBe(fmt.number(100));
    expect(result.companyCount).toBe(fmt.number(3));
  });

  test("getCountStrings: computes remotePct", async () => {
    mockMetadata();
    const { remotePct } = await metadataModel.getCountStrings();
    expect(remotePct).toBe("40%");
  });

  test("getCountStrings: remotePct is 0% when remote is absent", async () => {
    mockMetadata({ presenceCounts: {} });
    const { remotePct } = await metadataModel.getCountStrings();
    expect(remotePct).toBe("0%");
  });

  test("getCountStrings: all percentages are 0% when jobCount is 0", async () => {
    mockMetadata({ jobCount: 0 });
    const { remotePct, topJobFamilies } = await metadataModel.getCountStrings();
    expect(remotePct).toBe("0%");
    expect(topJobFamilies[0]?.pct).toBe("0%");
  });

  test("getCountStrings: topJobFamilies maps 3 labels with correct percentages and sort", async () => {
    mockMetadata();
    const { topJobFamilies } = await metadataModel.getCountStrings();

    expect(topJobFamilies).toEqual([
      { pct: "50%", label: "Engineering" },
      { pct: "25%", label: "Data" },
      { pct: "15%", label: "Design" },
    ]);
  });

  test("getCountStrings: topJobFamilies returns fewer than 3 when fewer families exist", async () => {
    mockMetadata({ jobFamilyCounts: { engineering: 500, data: 250 } });
    const { topJobFamilies } = await metadataModel.getCountStrings();
    expect(topJobFamilies).toHaveLength(2);
  });

  test("getJobFamilySeries: maps labels, counts, numeric percentages, and sort order", async () => {
    mockMetadata({ jobFamilyCounts: { engineering: 500, data: 250 } });
    const series = await metadataModel.getJobFamilySeries();

    expect(series).toEqual([
      { label: "Engineering", count: 500, pct: 50 },
      { label: "Data", count: 250, pct: 25 },
    ]);
  });

  test("getPresenceSeries: returns presence data in display order", async () => {
    mockMetadata();
    const series = await metadataModel.getPresenceSeries();

    expect(series).toEqual([
      { label: "Remote", count: 400, pct: 40 },
      { label: "Hybrid", count: 250, pct: 25 },
      { label: "On-site", count: 350, pct: 35 },
    ]);
  });

  test("getWorkTimeSeries: returns work time data in display order", async () => {
    mockMetadata();
    const series = await metadataModel.getWorkTimeSeries();

    expect(series).toEqual([
      { label: "Full-time", count: 700, pct: 70 },
      { label: "Part-time", count: 200, pct: 20 },
      { label: "Variable", count: 75, pct: 7.5 },
      { label: "Per diem", count: 25, pct: 2.5 },
    ]);
  });

  test("getCompanyStageSeries: returns stage data in funding progression order", async () => {
    mockMetadata({
      stageCounts: {
        public: 400,
        seed: 100,
        series_b: 150,
        series_a: 300,
      },
    });
    const series = await metadataModel.getCompanyStageSeries();

    expect(series).toEqual([
      { label: "Seed", count: 100, pct: 10 },
      { label: "Series A", count: 300, pct: 30 },
      { label: "Series B", count: 150, pct: 15 },
      { label: "Public", count: 400, pct: 40 },
    ]);
  });

  test("getTopLocations: maps state labels and sorts by count", async () => {
    mockMetadata({
      topLocationCounts: {
        WA: 100,
        CA: 300,
        NY: 200,
      },
    });
    const series = await metadataModel.getTopLocations();

    expect(series).toEqual([
      { label: "California", count: 300, pct: 30 },
      { label: "New York", count: 200, pct: 20 },
      { label: "Washington", count: 100, pct: 10 },
    ]);
  });

  test("series helpers return 0 percentages when jobCount is 0", async () => {
    mockMetadata({ jobCount: 0, presenceCounts: { remote: 3 } });
    const series = await metadataModel.getPresenceSeries();
    expect(series).toEqual([{ label: "Remote", count: 3, pct: 0 }]);
  });

  test("getSalaryStats: returns salary stats from metadata", async () => {
    mockMetadata();
    const salaryStats = await metadataModel.getSalaryStats();

    expect(salaryStats).toEqual([
      {
        count: 40,
        p25: 100_000,
        median: 120_000,
        p75: 150_000,
      },
      {
        jobFamily: "engineering",
        count: 20,
        p25: 110_000,
        median: 130_000,
        p75: 160_000,
      },
    ]);
  });
});

test("getCompanyFormOptions: returns company names as sorted form options", async () => {
  mockMetadata();
  const options = await metadataModel.getCompanyFormOptions();

  expect(options).toEqual([
    { value: "acme", label: "Acme" },
    { value: "example", label: "Example" },
    { value: "test", label: "Test" },
  ]);
});
