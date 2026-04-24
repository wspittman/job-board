import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, suite, test } from "node:test";
import { html } from "../../src/html/html.ts";
import { CommandError } from "../../src/types.ts";
import { afterReset, logBasePath, makeFileTracker } from "../setup.ts";

after(afterReset);

const touchedFiles = makeFileTracker();

suite("html command", () => {
  test("run: converts markdown to HTML and writes output file", async () => {
    const inPath = path.join(logBasePath, "html", "in", "test-post.md");
    const outPath = path.join(logBasePath, "html", "out", "test-post.html");
    touchedFiles.push(inPath, outPath);

    await mkdir(path.dirname(inPath), { recursive: true });
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(inPath, "# Hello World\n\nSome content.", "utf-8");

    await html.run!(["test-post"]);

    const output = await readFile(outPath, "utf-8");
    assert.ok(output.includes("Hello World"));
    assert.ok(output.includes("Some content"));
  });

  const invalidFileNames = ["", "   ", "../evil", "nonexistent-post"];

  invalidFileNames.forEach((fileName) => {
    test(`run: throws CommandError for invalid file name "${fileName}"`, async () => {
      await assert.rejects(() => html.run!([fileName]), CommandError);
    });
  });
});
