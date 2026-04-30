import { expect, suite, test, vi } from "vitest";
import { api } from "./api";
import type { MetadataModelApi } from "./apiTypes";
import { metadataModel } from "./metadataModel";

vi.mock("./api", () => ({
  api: { fetchMetadata: vi.fn() },
}));

// eslint-disable-next-line @typescript-eslint/unbound-method
const mockFetch = vi.mocked(api.fetchMetadata);

function makeMetadata(
  overrides: Partial<MetadataModelApi> = {},
): MetadataModelApi {
  return {
    timestamp: 0,
    companyCount: 5,
    companyNames: [],
    jobCount: 100,
    recentJobCount: 10,
    presenceCounts: { remote: 40, onsite: 35, hybrid: 25 },
    jobFamilyCounts: { engineering: 60, data: 25, design: 15 },
    ...overrides,
  };
}

suite("MetadataModel.getCountStrings", () => {
  test("formats all count strings", async () => {
    mockFetch.mockResolvedValue(makeMetadata());

    const result = await metadataModel.getCountStrings();

    expect(result.jobCount).toBe("100");
    expect(result.recentJobCount).toBe("10");
    expect(result.companyCount).toBe("5");
  });

  test("computes remotePct from presenceCounts.remote / jobCount", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({ presenceCounts: { remote: 40 }, jobCount: 100 }),
    );

    const { remotePct } = await metadataModel.getCountStrings();

    expect(remotePct).toBe("40%");
  });

  test("remotePct is 0% when remote is absent", async () => {
    mockFetch.mockResolvedValue(makeMetadata({ presenceCounts: {} }));

    const { remotePct } = await metadataModel.getCountStrings();

    expect(remotePct).toBe("0%");
  });

  test("all percentages are 0% when jobCount is 0", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({
        jobCount: 0,
        presenceCounts: { remote: 0 },
        jobFamilyCounts: { engineering: 0 },
      }),
    );

    const { remotePct, topJobFamilies } = await metadataModel.getCountStrings();

    expect(remotePct).toBe("0%");
    expect(topJobFamilies[0]?.pct).toBe("0%");
  });

  test("topJobFamilies are sorted by count descending", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({
        jobFamilyCounts: { design: 15, engineering: 60, data: 25 },
      }),
    );

    const { topJobFamilies } = await metadataModel.getCountStrings();

    expect(topJobFamilies.map((f) => f.label)).toEqual([
      "Engineering",
      "Data",
      "Design",
    ]);
  });

  test("topJobFamilies maps to human-readable labels with correct percentages", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({
        jobCount: 100,
        jobFamilyCounts: { engineering: 60, data: 25, design: 15 },
      }),
    );

    const { topJobFamilies } = await metadataModel.getCountStrings();

    expect(topJobFamilies).toEqual([
      { pct: "60%", label: "Engineering" },
      { pct: "25%", label: "Data" },
      { pct: "15%", label: "Design" },
    ]);
  });

  test("topJobFamilies is capped at 3 entries", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({
        jobFamilyCounts: {
          engineering: 40,
          data: 30,
          design: 20,
          marketing: 10,
        },
      }),
    );

    const { topJobFamilies } = await metadataModel.getCountStrings();

    expect(topJobFamilies).toHaveLength(3);
    expect(topJobFamilies.map((f) => f.label)).toEqual([
      "Engineering",
      "Data",
      "Design",
    ]);
  });

  test("topJobFamilies returns fewer than 3 when fewer families exist", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({ jobFamilyCounts: { engineering: 80, data: 20 } }),
    );

    const { topJobFamilies } = await metadataModel.getCountStrings();

    expect(topJobFamilies).toHaveLength(2);
  });
});

suite("MetadataModel.getCompanyFormOptions", () => {
  test("returns company names as sorted form options", async () => {
    mockFetch.mockResolvedValue(
      makeMetadata({
        companyNames: [
          ["c1", "Zephyr"],
          ["c2", "Acme"],
          ["c3", "Momentum"],
        ],
      }),
    );

    const options = await metadataModel.getCompanyFormOptions();

    expect(options).toEqual([
      { value: "c2", label: "Acme" },
      { value: "c3", label: "Momentum" },
      { value: "c1", label: "Zephyr" },
    ]);
  });
});
