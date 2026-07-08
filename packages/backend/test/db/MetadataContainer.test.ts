import { connectDB, Container } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";
import { MetadataContainer } from "../../src/db/MetadataContainer.ts";
import type { Metadata } from "../../src/models/models.ts";

suite("MetadataContainer", () => {
  let metadata: MetadataContainer;

  before(async () => {
    const containers = await connectDB({
      endpoint: "unused-for-mock",
      key: "unused-for-mock",
      name: "unused-for-mock",
      containers: [MetadataContainer.ContainerOptions()],
      mockDBData: {
        metadata: [{ id: "company", companyCount: 3 }],
      },
    });

    metadata = new MetadataContainer(
      containers["metadata"]! as Container<Metadata>,
    );
  });

  test("defines its container options", () => {
    assert.deepEqual(MetadataContainer.ContainerOptions(), {
      name: "metadata",
      partitionKey: "id",
      indexExclusions: "all",
    });
  });

  test("reads metadata by type", async () => {
    assert.deepEqual(await metadata.get("company"), {
      id: "company",
      companyCount: 3,
    });
    assert.equal(await metadata.get("job"), undefined);
  });

  test("saves metadata by type", async () => {
    const jobMetadata = {
      id: "job",
      jobCount: 7,
      recentJobCount: 2,
    } as const;

    await metadata.upsert(jobMetadata);

    assert.deepEqual(await metadata.get("job"), jobMetadata);
  });
});
