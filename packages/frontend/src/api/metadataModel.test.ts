import { expect, suite, test } from "vitest";
import { mockMetadata } from "../utils/testUtils";
import { metadataModel } from "./metadataModel";

suite("metadataModel", () => {
  test("getCountStrings: formats all count strings", async () => {
    mockMetadata();
    const result = await metadataModel.getCountStrings();

    expect(result.jobCount).toBe((1000).toLocaleString());
    expect(result.recentJobCount).toBe((100).toLocaleString());
    expect(result.companyCount).toBe((3).toLocaleString());
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
