import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { ats } from "../../src/ats/ats.ts";
import { db } from "../../src/db/db.ts";
import { refreshJobsForCompany } from "../../src/sync/jobs.ts";
import { JOB_EXPIRY_MS } from "../../src/utils/constants.ts";

const key = { id: "acme", ats: "lever" } as const;

suite("refreshJobsForCompany", () => {
  test("saves a new ETag when an unstable ATS response has no new jobs", async (context) => {
    const eTagSet = context.mock.fn(async () => {});

    context.mock.getter(db, "metadata", () => ({
      getItem: async () => ({
        id: "company",
        companyQuickRef: [[key.id, "Acme"]],
      }),
    }));
    context.mock.getter(db, "eTag", () => ({
      get: async () => "old-etag",
      set: eTagSet,
    }));
    context.mock.getter(db, "ignoreJob", () => ({
      getIds: async () => [],
    }));
    context.mock.getter(db, "job", () => ({
      getIds: async () => ["job-1"],
      getExpiredIds: async () => [],
    }));
    context.mock.method(ats, "supportsETag", () => true);
    context.mock.method(ats, "getJobsETag", async () => ({
      stable: false,
      etag: "new-etag",
      data: [
        {
          item: {
            id: "job-1",
            companyId: key.id,
            title: "Software Engineer",
            description: "",
            postTS: Date.now(),
            applyUrl: "https://example.com/job-1",
          },
        },
      ],
    }));

    await refreshJobsForCompany(key);

    assert.equal(eTagSet.mock.callCount(), 1);
    assert.deepEqual(eTagSet.mock.calls[0]?.arguments, [
      "RefreshJobsForCompany_exists",
      key,
      "new-etag",
    ]);
  });

  test("removes expired saved jobs when the ATS ETag is stable", async (context) => {
    const now = Date.now();
    const getExpiredIds = context.mock.fn(async () => ["expired"]);
    const removeMany = context.mock.fn(async () => []);

    context.mock.getter(db, "metadata", () => ({
      getItem: async () => ({
        id: "company",
        companyQuickRef: [[key.id, "Acme"]],
      }),
    }));
    context.mock.getter(db, "eTag", () => ({
      get: async () => "etag-value",
    }));
    context.mock.getter(db, "job", () => ({
      getExpiredIds,
      removeMany,
    }));
    context.mock.method(ats, "supportsETag", () => true);
    context.mock.method(ats, "getJobsETag", async () => ({ stable: true }));

    await refreshJobsForCompany(key);

    assert.equal(getExpiredIds.mock.callCount(), 1);
    const [companyId, cutoff] = getExpiredIds.mock.calls[0]?.arguments ?? [];
    assert.equal(companyId, key.id);
    assert.equal(typeof cutoff, "number");
    assert.ok(cutoff >= now - JOB_EXPIRY_MS);
    assert.ok(cutoff <= Date.now() - JOB_EXPIRY_MS);
    assert.equal(removeMany.mock.callCount(), 1);
    assert.deepEqual(removeMany.mock.calls[0]?.arguments, [
      ["expired"],
      key.id,
    ]);
  });
});
