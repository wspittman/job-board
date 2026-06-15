import { connectDB, Container } from "dry-utils-cosmosdb";
import assert from "node:assert/strict";
import { beforeEach, suite, test } from "node:test";
import { JobContainer } from "../../src/db/JobContainer.ts";
import type { Job } from "../../src/models/models.ts";
import { MS_PER_DAY } from "../../src/utils/constants.ts";

const now = Date.now();
const job = (
  id: string,
  companyId: string,
  postTS: number,
  extras: Partial<Job> = {},
): Job => ({
  id,
  companyId,
  title: `Job ${id}`,
  description: "",
  postTS,
  applyUrl: `https://example.com/${id}`,
  ...extras,
});

suite("JobContainer", () => {
  let jobs: JobContainer;

  beforeEach(async () => {
    const containers = await connectDB({
      endpoint: "unused-for-mock",
      key: "unused-for-mock",
      name: "unused-for-mock",
      containers: [JobContainer.ContainerOptions()],
      mockDBData: {
        job: [
          { ...job("one", "acme", now), _ts: 100 },
          {
            ...job("two", "acme", now - 8 * MS_PER_DAY, {
              presence: "remote",
              jobFamily: "engineering",
            }),
            _ts: 200,
          },
          {
            ...job("three", "beta", now, {
              presence: "remote",
              jobFamily: "design",
            }),
            _ts: 300,
          },
        ],
      },
      mockDBProjects: {
        job: [
          {
            matcher: "DISTINCT VALUE c.companyId",
            fn: ({ items }) => [
              ...new Set(items.map((item) => item["companyId"])),
            ],
          },
        ],
      },
    });

    jobs = new JobContainer(containers["job"]! as Container<Job>);
  });

  test("defines its container options", () => {
    assert.deepEqual(JobContainer.ContainerOptions(), {
      name: "job",
      partitionKey: "companyId",
    });
  });

  test("reads jobs and projections", async () => {
    assert.equal((await jobs.get({ id: "one", companyId: "acme" }))?.id, "one");
    assert.deepEqual(await jobs.getIds("acme"), ["one", "two"]);
    assert.equal((await jobs.getAll("acme")).length, 2);
    assert.deepEqual(await jobs.getIdsAndTimestamps("acme"), [
      { id: "one", _ts: 100 },
      { id: "two", _ts: 200 },
    ]);
    assert.deepEqual(await jobs.getCompanyIds(), ["acme", "beta"]);
  });

  test("saves and removes jobs", async () => {
    const saved = job("new", "new-company", now);

    await jobs.upsert(saved);
    assert.equal((await jobs.get(saved))?.title, saved.title);

    await jobs.remove(saved);
    assert.equal(await jobs.get(saved), undefined);

    await jobs.removeMany(["one", "two"], "acme");
    assert.deepEqual(await jobs.getIds("acme"), []);
  });

  test("aggregates job metadata", async () => {
    assert.deepEqual(await jobs.aggregateMetadata(), {
      id: "job",
      jobCount: 3,
      recentJobCount: 2,
      presenceCounts: { remote: 2 },
      jobFamilyCounts: { engineering: 1, design: 1 },
    });
  });
});
