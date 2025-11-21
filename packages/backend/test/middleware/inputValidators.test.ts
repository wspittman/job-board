import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  useCompanyKey,
  useCompanyKeys,
  useFilters,
  useJobKey,
  useRefreshJobsOptions,
} from "../../src/middleware/inputValidators";

// Simple valid keys
const ats = "lever";
const companyId = "org1";
const jobId = "job1";

// Simple invalid keys
const ATS_INVALID = "invalid";
const ID_INVALID_TYPE = 123;
const ID_INVALID_LENGTH = "x".repeat(101);

// Timestamps
const NOW = Date.now();
const MIN_DATE = new Date("2024-01-01").getTime();

// Standard inputs
const COMPANY_KEY = { id: companyId, ats };
const COMPANY_KEYS = {
  ids: [companyId, "company2"],
  ats,
};
const JOB_KEY = { id: jobId, companyId };

// Filters
const SEARCH_TERM = "software engineer";
const SEARCH_TOO_SHORT = "a";
const SEARCH_TOO_LONG = "x".repeat(101);

suite("useCompanyKey", () => {
  const validCases = [
    { ...COMPANY_KEY },
    { ...COMPANY_KEY, otherKey: "stuff" },
  ];

  validCases.forEach((input) => {
    test(toTestName("Valid input", input), () => {
      const result = useCompanyKey(input);
      assert.deepStrictEqual(result, COMPANY_KEY);
    });
  });

  const invalidCases = [
    { ...COMPANY_KEY, id: undefined },
    { ...COMPANY_KEY, ats: undefined },
    { ...COMPANY_KEY, id: ID_INVALID_TYPE },
    { ...COMPANY_KEY, id: ID_INVALID_LENGTH },
    { ...COMPANY_KEY, ats: ATS_INVALID },
  ];

  invalidCases.forEach((input) => {
    test(toTestName("Invalid input", input), () => {
      assert.throws(() => useCompanyKey(input));
    });
  });
});

suite("useCompanyKeys", () => {
  const validCases = [
    { ...COMPANY_KEYS },
    { ...COMPANY_KEYS, otherKey: "stuff" },
  ];

  validCases.forEach((input) => {
    test(toTestName("Valid input", input), () => {
      const result = useCompanyKeys(input);
      assert.deepStrictEqual(result, COMPANY_KEYS);
    });
  });

  const invalidCases = [
    { ...COMPANY_KEYS, ids: undefined },
    { ...COMPANY_KEYS, ats: undefined },
    { ...COMPANY_KEYS, ids: "not-an-array" },
    { ...COMPANY_KEYS, ids: [] },
    { ...COMPANY_KEYS, ids: Array(51).fill("company") },
    { ...COMPANY_KEYS, ids: [ID_INVALID_TYPE] },
    { ...COMPANY_KEYS, ids: [ID_INVALID_LENGTH] },
    { ...COMPANY_KEYS, ats: ATS_INVALID },
  ];

  invalidCases.forEach((input) => {
    test(toTestName("Invalid input", input), () => {
      assert.throws(() => useCompanyKeys(input));
    });
  });
});

suite("useJobKey", () => {
  const validCases = [{ ...JOB_KEY }, { ...JOB_KEY, otherKey: "stuff" }];

  validCases.forEach((input) => {
    test(toTestName("Valid input", input), () => {
      const result = useJobKey(input);
      assert.deepStrictEqual(result, JOB_KEY);
    });
  });

  const invalidCases = [
    { ...JOB_KEY, id: undefined },
    { ...JOB_KEY, companyId: undefined },
    { ...JOB_KEY, id: ID_INVALID_TYPE },
    { ...JOB_KEY, companyId: ID_INVALID_TYPE },
    { ...JOB_KEY, id: ID_INVALID_LENGTH },
    { ...JOB_KEY, companyId: ID_INVALID_LENGTH },
  ];

  invalidCases.forEach((input) => {
    test(toTestName("Invalid input", input), () => {
      assert.throws(() => useJobKey(input));
    });
  });
});

suite("useRefreshJobsOptions", () => {
  const validCases = [
    {},
    { ats },
    { replaceJobsOlderThan: NOW },
    { ats, companyId },
    { ats, replaceJobsOlderThan: NOW },
    { ats, companyId, replaceJobsOlderThan: NOW },
  ];

  validCases.forEach((input) => {
    test(toTestName("Valid input", input), () => {
      const result = useRefreshJobsOptions(input);
      assert.deepStrictEqual(result, input);
    });
  });

  const invalidCases = [
    { companyId },
    { ats: ATS_INVALID },
    { ats, companyId: ID_INVALID_TYPE },
    { ats, companyId: ID_INVALID_LENGTH },
    { replaceJobsOlderThan: "not-a-number" },
    { replaceJobsOlderThan: MIN_DATE - 1 },
    { replaceJobsOlderThan: NOW + 10000 },
    { unknownField: "value" },
  ];

  invalidCases.forEach((input) => {
    test(toTestName("Invalid input", input), () => {
      assert.throws(() => useRefreshJobsOptions(input));
    });
  });
});

suite("useFilters", () => {
  const validCases = [
    {},
    { companyId },
    { isRemote: "true" },
    { isRemote: "TRUE" },
    { isRemote: "false" },
    { isRemote: "FALSE" },
    { isRemote: 0 },
    { isRemote: 1 },
    { title: SEARCH_TERM },
    { location: SEARCH_TERM },
    { daysSince: "30" },
    { daysSince: 30 },
    { maxExperience: "5" },
    { maxExperience: 5 },
    { minSalary: "50000" },
    { minSalary: 50000 },
    {
      companyId,
      isRemote: "true",
      title: SEARCH_TERM,
      location: SEARCH_TERM,
      daysSince: "30",
      maxExperience: "5",
      minSalary: "50000",
    },
  ];

  function coerceBool(key: string, val?: unknown) {
    if (val == null) return {};
    const str = String(val).toLowerCase();
    const hasTrue = ["true", "1", "yes", "on", "y", "enabled"].includes(str);
    const hasFalse = ["false", "0", "no", "off", "n", "disabled"].includes(str);
    if (!hasTrue && !hasFalse) return {};
    return { [key]: hasTrue };
  }

  function coerceInt(key: string, val?: string | number) {
    if (val == null) return {};
    return { [key]: parseInt(String(val)) };
  }

  validCases.forEach((input) => {
    test(toTestName("Valid input", input), () => {
      const result = useFilters(input);
      const expected = {
        ...input,
        ...coerceBool("isRemote", input.isRemote),
        ...coerceInt("daysSince", input.daysSince),
        ...coerceInt("maxExperience", input.maxExperience),
        ...coerceInt("minSalary", input.minSalary),
      };
      assert.deepStrictEqual(result, expected);
    });
  });

  const invalidCases = [
    { companyId: ID_INVALID_LENGTH },
    { title: SEARCH_TOO_SHORT },
    { title: SEARCH_TOO_LONG },
    { location: SEARCH_TOO_SHORT },
    { location: SEARCH_TOO_LONG },
    { daysSince: "0" },
    { daysSince: "366" },
    { daysSince: "not-a-number" },
    { maxExperience: "-1" },
    { maxExperience: "101" },
    { maxExperience: "not-a-number" },
    { minSalary: "0" },
    { minSalary: "10000001" },
    { minSalary: "not-a-number" },
  ];

  invalidCases.forEach((input) => {
    test(toTestName("Invalid input", input), () => {
      const result = useFilters(input);
      assert.deepStrictEqual(result, {});
    });
  });
});

function toTestName(prefix: string, testCase: Record<string, unknown>) {
  return `${prefix}: ${JSON.stringify(testCase).slice(0, 70)}`;
}
