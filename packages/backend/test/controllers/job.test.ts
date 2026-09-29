import type { RawWhere } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";

import {
  buildLocationWhere,
  getJobs,
  hasJobSearchFilters,
} from "../../src/controllers/job.ts";
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
): Job => ({
  id,
  companyId: "acme",
  title: "Engineer",
  description: "",
  postTS,
  applyUrl: `https://example.com/${id}`,
  salaryRange: { min: minSalary },
  requiredExperience,
});

suite("Job Controller", () => {
  before(async () => {
    await mockDBContent({
      job: [
        job("highest-salary", 200, 300, 2),
        job("lowest-experience", 100, 200, 1),
        job("newest", 300, 100, 3),
      ],
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
      const result = await getJobs({ title: "Engineer", orderBy });

      assert.deepEqual(
        result.map(({ id }) => id),
        expectedIds,
      );
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
