import { expect, suite, test, vi } from "vitest";
import { fmt } from "../utils/format";
import type { FilterModelApi } from "./apiTypes";
import { FilterModel } from "./filterModel";

vi.mock("./metadataModel", () => ({
  metadataModel: { getCompanyFriendlyName: vi.fn(() => "Acme Inc.") },
}));

suite("FilterModel", () => {
  const fromLocationSearchStringCases: [string, Record<string, unknown>][] = [
    ["", {}],
    ["?isRemote=true", { isRemote: true }],
    ["?isRemote=false", { isRemote: false }],
    ["?companyId=acme&jobId=job-1", { companyId: "acme", jobId: "job-1" }],
    [
      "?title=engineer&location=Seattle%2C+WA",
      { title: "engineer", city: "Seattle, WA" },
    ],
    // Backward compat: bare city name
    ["?location=Austin", { city: "Austin" }],
    // Backward compat: city already present — location param is ignored
    ["?city=Chicago&location=Seattle%2C+IL", { city: "Chicago" }],
    // Backward compat: state already present — location param is ignored
    ["?state=WA&location=Seattle", { state: "WA" }],
  ];

  test.for(fromLocationSearchStringCases)(
    "fromLocationSearchString(%s) → %o",
    ([query, expected]) => {
      const model = FilterModel.fromLocationSearchString(query);
      const entries = Object.fromEntries(model.toEntries());
      expect(model.isEmpty()).toBe(!Object.keys(expected).length);
      expect(entries).toEqual(expected);
    },
  );

  test("fromFormData: reads fields", () => {
    const fd = new FormData();
    fd.set("title", "designer");
    fd.set("city", "New York");
    const model = FilterModel.fromFormData(fd);
    const entries = Object.fromEntries(model.toEntries());
    expect(entries["title"]).toBe("designer");
    expect(entries["city"]).toBe("New York");
  });

  test("fromFormData: missing field resolves to undefined (not included in entries)", () => {
    const model = FilterModel.fromFormData(new FormData());
    expect(model.toEntries().map(([k]) => k)).not.toContain("title");
  });

  const fromApiCases: [FilterModelApi, Record<string, unknown>][] = [
    [
      { title: "engineer", minSalary: 100000 },
      { title: "engineer", minSalary: 100000 },
    ],
    [{ companyId: undefined }, {}],
  ];

  test.for(fromApiCases)("fromApi(%o) → %o", ([apiInput, expected]) => {
    const model = FilterModel.fromApi(apiInput);
    const entries = Object.fromEntries(model.toEntries());
    expect(model.isEmpty()).toBe(!Object.keys(expected).length);
    expect(entries).toEqual(expected);
  });

  test("toLocationSearchString: round-trips title and location", () => {
    const original = FilterModel.fromLocationSearchString(
      "?title=engineer&location=Austin",
    );
    const serialized = original.toLocationSearchString();
    const restored = FilterModel.fromLocationSearchString(`?${serialized}`);
    expect(Object.fromEntries(restored.toEntries())).toEqual(
      Object.fromEntries(original.toEntries()),
    );
  });

  test.for([
    ["workTimeBasis", "full_time", "Full-time"],
    ["jobFamily", "engineering", "Engineering"],
    ["isRemote", "true", "Remote"],
    ["isRemote", "false", "In-Person / Hybrid"],
    ["title", "developer", "Title: developer"],
    ["city", "Seattle", "City: Seattle"],
    ["state", "WA", "State: Washington"],
    ["daysSince", "7", "Posted: Within 7 days"],
    ["maxExperience", "5", "Experience: 5 years"],
    ["minSalary", "100000", `Pay Rate: ${fmt.currency(100000)}`],
    ["companyId", "acme-corp", "Company: Acme Inc."],
  ] as [string, string, string][])(
    "toFriendlyStrings: key=%s value=%s → label contains '%s'",
    ([key, value, expectedLabel]) => {
      const model = FilterModel.fromLocationSearchString(`?${key}=${value}`);
      const strings = model.toFriendlyStrings();
      const found = strings.find(([k]) => k === key);
      expect(found).toBeDefined();
      expect(found![1]).toBe(expectedLabel);
    },
  );

  test("toFriendlyStrings: isSavedJob collapses to single 'Saved Job' entry", () => {
    const model = FilterModel.fromLocationSearchString(
      "?companyId=acme&jobId=job-1",
    );
    const strings = model.toFriendlyStrings();
    expect(strings).toHaveLength(1);
    expect(strings[0]).toEqual(["jobId", "Saved Job"]);
  });

  test.for([
    ["", true],
    ["?title=engineer", false],
  ] as [string, boolean][])("isEmpty: '%s' → %s", ([qs, expected]) => {
    expect(FilterModel.fromLocationSearchString(qs).isEmpty()).toBe(expected);
  });

  test.for([
    ["?companyId=acme&jobId=job-1", true],
    ["?companyId=acme", false],
    ["", false],
  ] as [string, boolean][])("isSavedJob: '%s' → %s", ([qs, expected]) => {
    expect(FilterModel.fromLocationSearchString(qs).isSavedJob()).toBe(
      expected,
    );
  });

  test.for([
    ["ab", undefined],
    ["abc", "abc"],
    ["  abc  ", "abc"],
    ["", undefined],
  ] as [string, string | undefined][])(
    "normSearchString: title='%s' → %s",
    ([value, expected]) => {
      const model = FilterModel.fromLocationSearchString(`?title=${value}`);
      const entries = Object.fromEntries(model.toEntries());
      expect(entries["title"]).toBe(expected);
    },
  );

  test.for([
    ["100", 100],
    ["-1", undefined],
    ["abc", undefined],
    ["0", 0],
  ] as [string, number | undefined][])(
    "normNumber: minSalary='%s' → %s",
    ([value, expected]) => {
      const model = FilterModel.fromLocationSearchString(`?minSalary=${value}`);
      const entries = Object.fromEntries(model.toEntries());
      expect(entries["minSalary"]).toBe(expected);
    },
  );

  test("normIdString: trims whitespace", () => {
    const model = FilterModel.fromLocationSearchString("?companyId=%20acme%20");
    const entries = Object.fromEntries(model.toEntries());
    expect(entries["companyId"]).toBe("acme");
  });

  test("normIdString: empty string resolves to undefined", () => {
    const model = FilterModel.fromLocationSearchString("?companyId=");
    expect(model.toEntries().map(([k]) => k)).not.toContain("companyId");
  });
});
