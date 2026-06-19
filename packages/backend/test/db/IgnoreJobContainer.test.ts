import { connectDB, Container } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";
import { IgnoreJobContainer } from "../../src/db/IgnoreJobContainer.ts";
import type { IgnoreJob } from "../../src/models/models.ts";
import { JOB_EXPIRY_SEC } from "../../src/utils/constants.ts";

suite("IgnoreJobContainer", () => {
  let ignoreJob: IgnoreJobContainer;

  before(async () => {
    const containers = await connectDB({
      endpoint: "unused-for-mock",
      key: "unused-for-mock",
      name: "unused-for-mock",
      containers: [IgnoreJobContainer.ContainerOptions()],
      mockDBData: { ignoreJob: [] },
    });

    ignoreJob = new IgnoreJobContainer(
      containers["ignoreJob"]! as Container<IgnoreJob>,
    );
  });

  test("defines its container options", () => {
    assert.deepEqual(IgnoreJobContainer.ContainerOptions(), {
      name: "ignoreJob",
      partitionKey: "atsCompany",
      ttlSeconds: JOB_EXPIRY_SEC,
      indexExclusions: "all",
    });
  });

  test("saves and reads ignored jobs using the company key", async () => {
    const key = { id: "acme", ats: "greenhouse" } as const;

    await ignoreJob.upsert("one", key, "Manual");
    assert.equal((await ignoreJob.get("one", key))?.reason, "Manual");

    await ignoreJob.upsertMany(["two", "three"], key, "Expired");
    assert.deepEqual(await ignoreJob.getIds(key), ["one", "two", "three"]);
    assert.equal(
      (await ignoreJob.get("two", key))?.atsCompany,
      "greenhouse+acme",
    );
  });
});
