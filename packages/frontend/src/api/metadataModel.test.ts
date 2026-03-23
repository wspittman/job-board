import { beforeEach, expect, suite, test, vi } from "vitest";
import type { MetadataModelApi } from "./apiTypes";

const fetchMetadata = vi.fn<() => Promise<MetadataModelApi>>();

vi.mock("./api", () => ({
  api: {
    fetchMetadata,
  },
}));

function createMetadata(
  overrides: Partial<MetadataModelApi> = {},
): MetadataModelApi {
  return {
    companyCount: 2,
    companyNames: [
      ["company-b", "Beta Corp"],
      ["company-a", "Alpha Co"],
    ],
    jobCount: 1234,
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}

async function loadMetadataModel() {
  const { metadataModel } = await import("./metadataModel");
  return metadataModel;
}

suite("metadataModel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    fetchMetadata.mockReset();
  });

  test("formats the metadata timestamp for display", async () => {
    fetchMetadata.mockResolvedValue(createMetadata());

    const toLocaleString = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("Nov 14, 2023, 10:13 AM");

    const metadataModel = await loadMetadataModel();

    await expect(metadataModel.getTimestampString()).resolves.toBe(
      "Nov 14, 2023, 10:13 AM",
    );
    expect(fetchMetadata).toHaveBeenCalledTimes(1);
    expect(toLocaleString).toHaveBeenCalledTimes(1);
  });

  test("formats job and company counts for display", async () => {
    fetchMetadata.mockResolvedValue(
      createMetadata({ jobCount: 1234567, companyCount: 8901 }),
    );

    const toLocaleString = vi
      .spyOn(Number.prototype, "toLocaleString")
      .mockReturnValueOnce("1,234,567")
      .mockReturnValueOnce("8,901");

    const metadataModel = await loadMetadataModel();

    await expect(metadataModel.getCountStrings()).resolves.toEqual({
      jobCount: "1,234,567",
      companyCount: "8,901",
    });
    expect(fetchMetadata).toHaveBeenCalledTimes(1);
    expect(toLocaleString).toHaveBeenCalledTimes(2);
  });

  test("maps company names into sorted form options", async () => {
    fetchMetadata.mockResolvedValue(createMetadata());

    const metadataModel = await loadMetadataModel();

    await expect(metadataModel.getCompanyFormOptions()).resolves.toEqual([
      { value: "company-a", label: "Alpha Co" },
      { value: "company-b", label: "Beta Corp" },
    ]);
  });

  test("stores company friendly names after a metadata fetch", async () => {
    fetchMetadata.mockResolvedValue(createMetadata());

    const metadataModel = await loadMetadataModel();

    expect(metadataModel.getCompanyFriendlyName("company-a")).toBeUndefined();

    await metadataModel.getCompanyFormOptions();

    expect(metadataModel.getCompanyFriendlyName("company-a")).toBe("Alpha Co");
    expect(
      metadataModel.getCompanyFriendlyName("missing-company"),
    ).toBeUndefined();
  });

  test("keeps the existing company name map when the company count is unchanged", async () => {
    fetchMetadata.mockResolvedValueOnce(createMetadata()).mockResolvedValueOnce(
      createMetadata({
        companyNames: [
          ["company-b", "Beta Labs"],
          ["company-a", "Acme Co"],
        ],
      }),
    );

    const metadataModel = await loadMetadataModel();

    await metadataModel.getCompanyFormOptions();
    await metadataModel.getCountStrings();

    expect(metadataModel.getCompanyFriendlyName("company-a")).toBe("Alpha Co");
    expect(metadataModel.getCompanyFriendlyName("company-b")).toBe("Beta Corp");
  });

  test("refreshes the cached company name map when the company count changes", async () => {
    fetchMetadata
      .mockResolvedValueOnce(
        createMetadata({
          companyCount: 1,
          companyNames: [["company-a", "Alpha Co"]],
        }),
      )
      .mockResolvedValueOnce(
        createMetadata({
          companyCount: 2,
          companyNames: [
            ["company-a", "Acme Co"],
            ["company-c", "Charlie LLC"],
          ],
        }),
      );

    const metadataModel = await loadMetadataModel();

    await metadataModel.getCompanyFormOptions();
    expect(metadataModel.getCompanyFriendlyName("company-a")).toBe("Alpha Co");

    await metadataModel.getTimestampString();

    expect(metadataModel.getCompanyFriendlyName("company-a")).toBe("Acme Co");
    expect(metadataModel.getCompanyFriendlyName("company-c")).toBe(
      "Charlie LLC",
    );
  });
});
