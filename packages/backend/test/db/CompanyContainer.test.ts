import { connectDB, Container } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { before, suite, test } from "node:test";
import { CompanyContainer } from "../../src/db/CompanyContainer.ts";
import type { Company } from "../../src/models/models.ts";

suite("CompanyContainer", () => {
  let company: CompanyContainer;

  before(async () => {
    const containers = await connectDB({
      endpoint: "unused-for-mock",
      key: "unused-for-mock",
      name: "unused-for-mock",
      containers: [CompanyContainer.ContainerOptions()],
      mockDBData: {
        company: [
          { id: "acme", ats: "greenhouse", name: "Acme", website: "acme.com" },
          { id: "beta", ats: "greenhouse", name: "Beta" },
          { id: "acme", ats: "lever", name: "Lever Acme" },
        ],
      },
    });

    company = new CompanyContainer(
      containers["company"]! as Container<Company>,
    );
  });

  test("defines its container options", () => {
    assert.deepEqual(CompanyContainer.ContainerOptions(), {
      name: "company",
      partitionKey: "ats",
      indexExclusions: ["/description/?", "/website/?"],
    });
  });

  test("reads companies and projections", async () => {
    assert.equal(
      (await company.get({ id: "acme", ats: "greenhouse" }))?.name,
      "Acme",
    );
    assert.deepEqual(await company.getIds("greenhouse"), ["acme", "beta"]);
    assert.equal((await company.getAll("greenhouse")).length, 2);
    assert.deepEqual(await company.getKeys(), [
      { id: "acme", ats: "greenhouse" },
      { id: "beta", ats: "greenhouse" },
      { id: "acme", ats: "lever" },
    ]);
    assert.deepEqual(await company.getQuickRefs(), [
      ["acme", "Acme", "acme.com"],
      ["beta", "Beta", undefined],
      ["acme", "Lever Acme", undefined],
    ]);
  });

  test("saves and removes companies", async () => {
    const saved = { id: "new", ats: "lever", name: "New Company" } as const;

    await company.upsert(saved);
    assert.deepEqual(await company.get(saved), saved);

    await company.remove(saved);
    assert.equal(await company.get(saved), undefined);
  });
});
