import { expect, suite, test } from "vitest";
import { FilterModel } from "./filterModel";

suite("FilterModel", () => {
  test("keeps valid filters and omits empty values from query params", () => {
    const filters = FilterModel.fromApi({
      title: "  Staff Engineer  ",
      companyId: "company-123",
      jobId: "job-456",
      isRemote: true,
      daysSince: 30,
      minSalary: 0,
      location: "  ",
    });

    expect(filters.isSavedJob()).toBe(true);
    expect(filters.toUrlSearchParams().toString()).toBe(
      "title=Staff+Engineer&companyId=company-123&isRemote=true&minSalary=0&daysSince=30&jobId=job-456",
    );
  });
});
