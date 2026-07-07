import { Query } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { suite, test } from "node:test";

import {
  applyJobOrder,
  buildLocationWhere,
  hasJobSearchFilters,
} from "../../src/controllers/job.ts";
import type { Filters } from "../../src/models/clientModels.ts";

type LocationWhereCase = {
  name: string;
  filters: Pick<Filters, "city" | "state" | "isRemote">;
  expected: ReturnType<typeof buildLocationWhere>;
};

const noCity = `NOT IS_DEFINED(c.primaryLocation.city)`;
const noRegion = `NOT IS_DEFINED(c.primaryLocation.regionCode)`;
const stateMatch = `c.primaryLocation.regionCode = @state`;
const cityMatch = `(CONTAINS(c.primaryLocation.city, @city, true) OR CONTAINS(@city, c.primaryLocation.city, true))`;
const countryWideRemote = `${noCity} AND ${noRegion}`;

suite("buildLocationWhere", () => {
  test("returns undefined without city or state", () => {
    assert.equal(buildLocationWhere({}), undefined);
  });

  test("builds local location clauses", () => {
    const cases: LocationWhereCase[] = [
      {
        name: "city and state",
        filters: { city: "Seattle", state: "WA", isRemote: false },
        expected: [
          `${stateMatch} AND ${cityMatch}`,
          { "@city": "Seattle", "@state": "WA" },
        ],
      },
      {
        name: "state only",
        filters: { state: "WA", isRemote: false },
        expected: [stateMatch, { "@city": "", "@state": "WA" }],
      },
      {
        name: "city only",
        filters: { city: "Seattle", isRemote: false },
        expected: [cityMatch, { "@city": "Seattle", "@state": "" }],
      },
    ];

    cases.forEach(({ name, filters, expected }) => {
      assert.deepEqual(buildLocationWhere(filters), expected, name);
    });
  });

  test("includes remote wildcard matches by default", () => {
    const cases: LocationWhereCase[] = [
      {
        name: "city and state includes state-wide and country-wide remote",
        filters: { city: "Seattle", state: "WA" },
        expected: [
          `${stateMatch} AND ${cityMatch} OR (c.presence = 'remote' AND (${noCity} AND ${stateMatch} OR ${countryWideRemote}))`,
          { "@city": "Seattle", "@state": "WA" },
        ],
      },
      {
        name: "state only includes country-wide remote",
        filters: { state: "WA" },
        expected: [
          `${stateMatch} OR (c.presence = 'remote' AND (${countryWideRemote}))`,
          { "@city": "", "@state": "WA" },
        ],
      },
      {
        name: "city only includes country-wide remote",
        filters: { city: "Seattle" },
        expected: [
          `${cityMatch} OR (c.presence = 'remote' AND (${countryWideRemote}))`,
          { "@city": "Seattle", "@state": "" },
        ],
      },
    ];

    cases.forEach(({ name, filters, expected }) => {
      assert.deepEqual(buildLocationWhere(filters), expected, name);
    });
  });
});

suite("applyJobOrder", () => {
  const cases: {
    name: string;
    orderBy: Filters["orderBy"];
    expectedQuery: string;
  }[] = [
    {
      name: "missing order defaults to newest post time",
      orderBy: undefined,
      expectedQuery: "SELECT TOP 24 * FROM c ORDER BY c.postTS DESC",
    },
    {
      name: "post time orders by newest post time",
      orderBy: "post_time",
      expectedQuery: "SELECT TOP 24 * FROM c ORDER BY c.postTS DESC",
    },
    {
      name: "highest salary orders by salary",
      orderBy: "highest_salary",
      expectedQuery: "SELECT TOP 24 * FROM c ORDER BY c.salaryRange.min DESC",
    },
    {
      name: "lowest experience orders by experience",
      orderBy: "lowest_experience",
      expectedQuery: "SELECT TOP 24 * FROM c ORDER BY c.requiredExperience ASC",
    },
    {
      name: "invalid order results in no ordering applied",
      orderBy: "salaryRange.min" as Filters["orderBy"],
      expectedQuery: "SELECT TOP 24 * FROM c",
    },
  ];

  cases.forEach(({ name, orderBy, expectedQuery }) => {
    test(name, () => {
      const q = new Query().top(24);
      applyJobOrder(q, orderBy);
      const { query, parameters } = q.build();

      assert.equal(query, expectedQuery);
      assert.deepEqual(parameters, []);
    });
  });
});

suite("hasJobSearchFilters", () => {
  const cases: {
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

  cases.forEach(({ name, filters, expected }) => {
    test(name, () => {
      assert.equal(hasJobSearchFilters(filters), expected);
    });
  });
});
