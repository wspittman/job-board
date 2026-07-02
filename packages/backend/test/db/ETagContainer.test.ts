import { connectDB, Container } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";
import { ETagContainer } from "../../src/db/ETagContainer.ts";
import type { ETag } from "../../src/models/models.ts";

suite("ETagContainer", () => {
  let etag: ETagContainer;

  before(async () => {
    const containers = await connectDB({
      endpoint: "unused-for-mock",
      key: "unused-for-mock",
      name: "unused-for-mock",
      containers: [ETagContainer.ContainerOptions()],
      mockDBData: { etag: [] },
    });

    etag = new ETagContainer(containers["etag"]! as Container<ETag>);
  });

  test("defines its container options", () => {
    assert.deepEqual(ETagContainer.ContainerOptions(), {
      name: "etag",
      partitionKey: "atsCompany",
      indexExclusions: "all",
      ttlSeconds: 2592000,
    });
  });

  test("returns undefined when a resource has no saved ETag", async () => {
    const result = await etag.get("/jobs", {
      id: "missing",
      ats: "greenhouse",
    });

    assert.equal(result, undefined);
  });

  test("saves independent ETags for a company's resource URLs", async () => {
    const key = { id: "acme", ats: "lever" } as const;
    const otherKey = { id: "other", ats: "lever" } as const;

    await etag.set("Path_1", key, 'W/"basic"');
    await etag.set("Path_2", key, 'W/"single"');
    await etag.set("Path_1", otherKey, 'W/"other"');

    assert.equal(await etag.get("Path_1", key), 'W/"basic"');
    assert.equal(await etag.get("Path_2", key), 'W/"single"');
    assert.equal(await etag.get("Path_1", otherKey), 'W/"other"');
  });

  test("normalizes relative URLs for Cosmos DB IDs", async () => {
    const key = { id: "acme", ats: "greenhouse" } as const;

    await etag.set("/url?content=true#open", key, 'W/"full"');

    const saved = await etag.getItem(
      "_url_content=true_open",
      "greenhouse+acme",
    );
    assert.deepEqual(saved, {
      id: "_url_content=true_open",
      atsCompany: "greenhouse+acme",
      etag: 'W/"full"',
    });
    assert.equal(await etag.get("/url?content=true#open", key), 'W/"full"');
  });
});
