import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, suite, test } from "node:test";
import { fileURLToPath } from "node:url";

import { readObj, readSources, writeObj } from "../../src/utils/fileUtils.ts";

const basePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const touchedDirs: string[] = [];

const makeSubRole = async (): Promise<string> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "file-utils-"));
  const subRole = path.basename(tempDir);
  await rm(tempDir, { recursive: true, force: true });
  touchedDirs.push(
    path.join(basePath, "input", subRole),
    path.join(basePath, "ground", subRole),
    path.join(basePath, "outcome", subRole),
    path.join(basePath, "report", subRole),
    path.join(basePath, "cache", subRole),
  );
  return subRole;
};

afterEach(async () => {
  await Promise.all(
    touchedDirs
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

suite("fileUtils", () => {
  test("writeObj: writes a JSON file with evalTS and key-based filename", async () => {
    const subRole = (await makeSubRole()) as Parameters<typeof readSources>[0];

    await writeObj({ status: "ok" }, "Report", subRole, "run", "summary");

    const filePath = path.join(basePath, "report", subRole, "run_summary.json");
    const file = JSON.parse(await readFile(filePath, "utf-8"));

    assert.equal(file.status, "ok");
    assert.match(file.evalTS, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("readObj: reads an existing JSON file and supports extensionless names", async () => {
    const subRole = (await makeSubRole()) as Parameters<typeof readSources>[0];
    const dir = path.join(basePath, "cache", subRole);
    await writeObj({ total: 3 }, "Cache", subRole, "stats");

    const fromBareName = await readObj<{ total: number }>(
      "Cache",
      subRole,
      "stats",
    );
    const fromJsonName = await readObj<{ total: number }>(
      "Cache",
      subRole,
      "stats.json",
    );

    assert.equal(fromBareName?.total, 3);
    assert.equal(fromJsonName?.total, 3);
    await rm(dir, { recursive: true, force: true });
  });

  test("readObj: returns undefined for missing or invalid JSON files", async () => {
    const subRole = (await makeSubRole()) as Parameters<typeof readSources>[0];
    const dir = path.join(basePath, "cache", subRole);

    await writeObj({ sentinel: true }, "Cache", subRole, "seed");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "broken.json"), "not-json");

    assert.equal(await readObj("Cache", subRole, "does-not-exist"), undefined);
    assert.equal(await readObj("Cache", subRole, "broken"), undefined);
  });

  test("readSources: returns only sources that have both input and ground files", async () => {
    const subRole = (await makeSubRole()) as Parameters<typeof readSources>[0];

    await writeObj({ id: 1 }, "Input", subRole, "complete");
    await writeObj({ id: 1 }, "Ground", subRole, "complete");
    await writeObj({ id: 2 }, "Input", subRole, "missing-ground");

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (msg: string) => warnings.push(msg);

    let sources!: Awaited<ReturnType<typeof readSources>>;
    try {
      sources = await readSources(subRole);
    } finally {
      console.warn = originalWarn;
    }

    assert.equal(sources.length, 1);
    assert.equal(sources[0]?.sourceName, "complete.json");
    assert.deepEqual(sources[0]?.input, {
      evalTS: sources[0]?.input.evalTS,
      id: 1,
    });
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] ?? "", /missing-ground\.json/);
  });
});
