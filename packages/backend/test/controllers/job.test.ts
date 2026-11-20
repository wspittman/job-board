import type { RawWhere } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";

import {
  buildLocationWhere,
  getJobs,
  hasJobSearchFilters,
  normalizeTitleSearchTerms,
} from "../../src/controllers/job.ts";
import { db } from "../../src/db/db.ts";
import type { Filters } from "../../src/models/clientModels.ts";
import type { Job } from "../../src/models/models.ts";
import { mockDBContent } from "../setup.ts";

type LocationWhereCase = {
  name: string;
  filters: Pick<Filters, "city" | "state" | "isRemote">;
  expected: RawWhere;
};

const job = (
  id: string,
  postTS: number,
  minSalary: number,
  requiredExperience: number,
  extras: Partial<Job> = {},
): Job => ({
  id,
  companyId: "acme",
  title: "Ordering Engineer",
  description: "",
  postTS,
  applyUrl: `https://example.com/${id}`,
  salaryRange: { min: minSalary },
  requiredExperience,
  ...extras,
});

suite("Job Controller", () => {
  before(async () => {
    await mockDBContent({
      job: [
        job("highest-salary", 200, 300, 2),
        job("lowest-experience", 100, 200, 1),
        job("newest", 300, 100, 3),
        job("senior-platform", 700, 150, 4, {
          title: "Senior Platform Developer",
          presence: "remote",
          jobFamily: "engineering",
        }),
        job("reversed-terms", 650, 150, 4, {
          title: "Platform Lead, Senior",
          presence: "onsite",
          jobFamily: "engineering",
        }),
        job("missing-senior", 600, 150, 4, {
          title: "Platform Architect",
          presence: "remote",
          jobFamily: "engineering",
        }),
        job("description-only", 550, 150, 4, {
          title: "Solutions Architect",
          description: "Build a senior platform for internal users.",
          presence: "remote",
          jobFamily: "engineering",
        }),
        job("design-match", 500, 150, 4, {
          title: "Senior Platform Designer",
          presence: "remote",
          jobFamily: "design",
        }),
      ],
    });
  });

  const titleTermCases = [
    { input: "engineer", expected: ["engineer"] },
    {
      input: "  senior\t platform \n engineer  ",
      expected: ["senior", "platform", "engineer"],
    },
    { input: "   ", expected: [] },
  ];

  titleTermCases.forEach(({ input, expected }) => {
    test(`normalizeTitleSearchTerms: ${JSON.stringify(input)}`, () => {
      assert.deepEqual(normalizeTitleSearchTerms(input), expected);
    });
  });

  test("buildLocationWhere: returns undefined without city or state", () => {
    assert.equal(buildLocationWhere({}), undefined);
  });

  const localLocationWhereCases: LocationWhereCase[] = [
    {
      name: "city and state",
      filters: { city: "Seattle", state: "WA", isRemote: false },
      expected: [
        `(c.primaryLocation.regionCode = @p0) AND ((CONTAINS(c.primaryLocation.city, @p1, true)) OR (CONTAINS(@p2, c.primaryLocation.city, true)))`,
        { "@p0": "WA", "@p1": "Seattle", "@p2": "Seattle" },
      ],
    },
    {
      name: "state only",
      filters: { state: "WA", isRemote: false },
      expected: [`c.primaryLocation.regionCode = @p0`, { "@p0": "WA" }],
    },
    {
      name: "city only",
      filters: { city: "Seattle", isRemote: false },
      expected: [
        `(CONTAINS(c.primaryLocation.city, @p0, true)) OR (CONTAINS(@p1, c.primaryLocation.city, true))`,
        { "@p0": "Seattle", "@p1": "Seattle" },
      ],
    },
  ];

  localLocationWhereCases.forEach(({ name, filters, expected }) => {
    test(`buildLocationWhere: builds local location clauses: ${name}`, () => {
      assert.deepEqual(buildLocationWhere(filters)?.build(), expected, name);
    });
  });

  const remoteLocationWhereCases: LocationWhereCase[] = [
    {
      name: "city and state includes state-wide and country-wide remote",
      filters: { city: "Seattle", state: "WA" },
      expected: [
        `((c.primaryLocation.regionCode = @p0) AND ((CONTAINS(c.primaryLocation.city, @p1, true)) OR (CONTAINS(@p2, c.primaryLocation.city, true)))) OR ((c.presence = @p3) AND (((NOT IS_DEFINED(c.primaryLocation.city)) AND (c.primaryLocation.regionCode = @p4)) OR ((NOT IS_DEFINED(c.primaryLocation.city)) AND (NOT IS_DEFINED(c.primaryLocation.regionCode)))))`,
        {
          "@p0": "WA",
          "@p1": "Seattle",
          "@p2": "Seattle",
          "@p3": "remote",
          "@p4": "WA",
        },
      ],
    },
    {
      name: "state only includes country-wide remote",
      filters: { state: "WA" },
      expected: [
        `(c.primaryLocation.regionCode = @p0) OR ((c.presence = @p1) AND ((NOT IS_DEFINED(c.primaryLocation.city)) AND (NOT IS_DEFINED(c.primaryLocation.regionCode))))`,
        { "@p0": "WA", "@p1": "remote" },
      ],
    },
    {
      name: "city only includes country-wide remote",
      filters: { city: "Seattle" },
      expected: [
        `((CONTAINS(c.primaryLocation.city, @p0, true)) OR (CONTAINS(@p1, c.primaryLocation.city, true))) OR ((c.presence = @p2) AND ((NOT IS_DEFINED(c.primaryLocation.city)) AND (NOT IS_DEFINED(c.primaryLocation.regionCode))))`,
        { "@p0": "Seattle", "@p1": "Seattle", "@p2": "remote" },
      ],
    },
  ];

  remoteLocationWhereCases.forEach(({ name, filters, expected }) => {
    test(`buildLocationWhere: includes remote wildcard matches by default: ${name}`, () => {
      assert.deepEqual(buildLocationWhere(filters)?.build(), expected, name);
    });
  });

  const jobOrderCases: {
    name: string;
    orderBy: Filters["orderBy"];
    expectedIds: string[];
  }[] = [
    {
      name: "missing order defaults to newest post time",
      orderBy: undefined,
      expectedIds: ["newest", "highest-salary", "lowest-experience"],
    },
    {
      name: "post time orders by newest post time",
      orderBy: "post_time",
      expectedIds: ["newest", "highest-salary", "lowest-experience"],
    },
    {
      name: "highest salary orders by salary",
      orderBy: "highest_salary",
      expectedIds: ["highest-salary", "lowest-experience", "newest"],
    },
    {
      name: "lowest experience orders by experience",
      orderBy: "lowest_experience",
      expectedIds: ["lowest-experience", "highest-salary", "newest"],
    },
  ];

  jobOrderCases.forEach(({ name, orderBy, expectedIds }) => {
    test(`getJobs: ${name}`, async () => {
      const result = await getJobs({ title: "ordering", orderBy });

      assert.deepEqual(
        result.map(({ id }) => id),
        expectedIds,
      );
    });
  });

  test("getJobs: one title term uses full-text matching", async () => {
    const result = await getJobs({ title: "developer" });

    assert.deepEqual(
      result.map(({ id }) => id),
      ["senior-platform"],
    );
  });

  test("getJobs: multiple title terms require every term without requiring order or adjacency", async () => {
    const result = await getJobs({ title: "platform senior" });

    assert.deepEqual(
      result.map(({ id }) => id),
      ["senior-platform", "reversed-terms", "design-match"],
    );
  });

  test("getJobs: normalizes repeated title whitespace", async () => {
    const result = await getJobs({ title: "  platform   senior  " });

    assert.deepEqual(
      result.map(({ id }) => id),
      ["senior-platform", "reversed-terms", "design-match"],
    );
  });

  test("getJobs: title search does not match description text", async () => {
    const result = await getJobs({ title: "platform" });

    assert.deepEqual(
      result.map(({ id }) => id),
      ["senior-platform", "reversed-terms", "missing-senior", "design-match"],
    );
  });

  test("getJobs: composes title search with structured filters", async () => {
    const result = await getJobs({
      title: "platform senior",
      jobFamily: "design",
    });

    assert.deepEqual(
      result.map(({ id }) => id),
      ["design-match"],
    );
  });

  test("getJobs: parameterizes every user-controlled title term", async (context) => {
    const queryMock = context.mock.method(db.job, "query", async () => []);

    await getJobs({ title: 'engineer") OR true --' });

    assert.equal(queryMock.mock.callCount(), 1);
    assert.deepEqual(queryMock.mock.calls[0]?.arguments[0], {
      query:
        "SELECT TOP 24 * FROM c WHERE FULLTEXTCONTAINSALL(c.title, @p0, @p1, @p2, @p3) ORDER BY c.postTS DESC",
      parameters: [
        { name: "@p0", value: 'engineer")' },
        { name: "@p1", value: "OR" },
        { name: "@p2", value: "true" },
        { name: "@p3", value: "--" },
      ],
    });
  });

  const hasJobSearchFilterCases: {
    name: string;
    filters: Filters;
    expected: boolean;
  }[] = [
    {
      name: "empty filters are not searchable",
      filters: {},
      expected: false,
    },
    {
      name: "order by alone is not searchable",
      filters: { orderBy: "highest_salary" },
      expected: false,
    },
    {
      name: "title is searchable",
      filters: { title: "engineer" },
      expected: true,
    },
    {
      name: "false boolean filter is searchable",
      filters: { isRemote: false },
      expected: true,
    },
    {
      name: "real filter with order by is searchable",
      filters: { title: "engineer", orderBy: "lowest_experience" },
      expected: true,
    },
  ];

  hasJobSearchFilterCases.forEach(({ name, filters, expected }) => {
    test(`hasJobSearchFilters: ${name}`, () => {
      assert.equal(hasJobSearchFilters(filters), expected);
    });
  });
});
