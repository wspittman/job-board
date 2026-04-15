import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, suite, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  readObj,
  readManyObj,
  writeObj,
  type Place,
} from "../../src/utils/fileUtils.ts";

const basePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data",
);

const touchedDirs: string[] = [];

const makeSubFolder = async (group: Place["group"]): Promise<string> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "file-utils-"));
  const subFolder = path.basename(tempDir);
  await rm(tempDir, { recursive: true, force: true });
  touchedDirs.push(path.join(basePath, group, "in", subFolder));
  touchedDirs.push(path.join(basePath, group, "out", subFolder));
  return subFolder;
};

afterEach(async () => {
  await Promise.all(
    touchedDirs
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

suite("fileUtils", () => {
  test("writeObj: writes a JSON file with evalTS and correctly structured path", async () => {
    const subFolder = await makeSubFolder("eval");
    const place: Place = {
      group: "eval",
      stage: "out",
      folder: subFolder,
      file: "summary",
    };

    await writeObj({ status: "ok" }, place);

    const filePath = path.join(
      basePath,
      "eval",
      "out",
      subFolder,
      "summary.json",
    );
    const file = JSON.parse(await readFile(filePath, "utf-8"));

    assert.equal(file.status, "ok");
    assert.match(file.evalTS, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("readObj: reads an existing JSON file and supports extensionless names", async () => {
    const subFolder = await makeSubFolder("cache");
    const place: Place = {
      group: "cache",
      stage: "in",
      folder: subFolder,
      file: "stats",
    };

    await writeObj({ total: 3 }, place);

    const fromBareName = await readObj<{ total: number }>(place);
    const fromJsonName = await readObj<{ total: number }>({
      ...place,
      file: "stats.json",
    });

    assert.equal(fromBareName?.total, 3);
    assert.equal(fromJsonName?.total, 3);
  });

  test("readObj: returns undefined for missing or invalid JSON files", async () => {
    const subFolder = await makeSubFolder("cache");
    const dir = path.join(basePath, "cache", "in", subFolder);

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "broken.json"), "not-json");

    assert.equal(
      await readObj({
        group: "cache",
        stage: "in",
        folder: subFolder,
        file: "does-not-exist",
      }),
      undefined,
    );
    assert.equal(
      await readObj({
        group: "cache",
        stage: "in",
        folder: subFolder,
        file: "broken",
      }),
      undefined,
    );
  });

  test("readManyObj: returns all valid objects in a folder", async () => {
    const subFolder = await makeSubFolder("playground");
    const place: Place = {
      group: "playground",
      stage: "in",
      folder: subFolder,
    };

    await writeObj({ id: 1 }, { ...place, file: "one" });
    await writeObj({ id: 2 }, { ...place, file: "two" });

    // Manually write a broken file
    const folderPath = path.join(basePath, "playground", "in", subFolder);
    await writeFile(path.join(folderPath, "broken.json"), "not-json");

    const objects = await readManyObj<{ id: number }>(place);

    assert.equal(objects.length, 2);
    const ids = objects.map((o) => o.id).sort();
    assert.deepEqual(ids, [1, 2]);
  });
});
