import assert from "node:assert/strict";
import { beforeEach, suite, test } from "node:test";
import { ats } from "../../src/ats/ats.ts";
import { db } from "../../src/db/db.ts";
import { refreshJobsForCompany } from "../../src/refresh/refreshJobsForCompany.ts";
import { Bag } from "../../src/types/types.ts";
import { mockDBContent, telemetryContext } from "../setup.ts";

const etagId = "RefreshJobsForCompany_exists";
const key = { id: "acme", ats: "lever" } as const;
const mockJob = {
  id: "job-1",
  companyId: key.id,
  title: "Software Engineer",
  description: "",
  postTS: Date.now(),
  applyUrl: "https://example.com/job-1",
};
const mockOldJob = {
  id: "job-2",
  companyId: key.id,
  title: "Software Engineer",
  description: "",
  postTS: new Date("2025").getTime(),
  applyUrl: "https://example.com/job-2",
};

suite("refreshJobsForCompany", () => {
  beforeEach(async () => {
    await mockDBContent({
      metadata: [
        { id: "company", companyQuickRef: [[key.id, "Acme"]] },
        { id: "job", jobCount: 2 },
      ],
      etag: [
        {
          id: etagId,
          atsCompany: "lever+acme",
          etag: "old-etag",
        },
      ],
      job: [mockJob, mockOldJob],
    });
  });

  test("ETag stable", async (context) => {
    context.mock.method(ats, "supportsETag", () => true);
    context.mock.method(ats, "getJobsETag", async () => ({ stable: true }));

    // Two jobs present
    assert.deepEqual(await db.job.getIds(key.id), ["job-1", "job-2"]);

    await refreshJobsForCompany(key);

    // Verify expected paths taken
    const props = telemetryContext["prop"] as Bag;
    assert.equal(props["Company_HasDBJobs"], true);
    assert.equal(props["ATS_Jobs_Stable"], true);
    assert.equal(props["ATS_Jobs_All"], undefined);

    // Expired job removed
    assert.deepEqual(await db.job.getIds(key.id), ["job-1"]);
  });

  test("ETag unstable, no new jobs", async (context) => {
    context.mock.method(ats, "supportsETag", () => true);
    context.mock.method(ats, "getJobsETag", async () => ({
      stable: false,
      etag: "new-etag",
      data: [{ item: mockJob }, { item: mockOldJob }],
    }));

    // Two jobs present
    assert.deepEqual(await db.job.getIds(key.id), ["job-1", "job-2"]);

    await refreshJobsForCompany(key);

    // Verify expected paths taken
    const props = telemetryContext["prop"] as Bag;
    assert.equal(props["Company_HasDBJobs"], true);
    assert.equal(props["ATS_Jobs_Stable"], undefined);
    assert.equal(props["ATS_Jobs_All"], 2);

    // Expired job removed
    assert.deepEqual(await db.job.getIds(key.id), ["job-1"]);

    // ETag updated
    assert.equal(await db.eTag.get(etagId, key), "new-etag");
  });
});
