import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, suite, test } from "node:test";
import { html, parseFrontmatter, runBlog } from "../../src/html/html.ts";
import { CommandError } from "../../src/types.ts";
import { afterReset, logBasePath, makeFileTracker } from "../setup.ts";

after(afterReset);

const touchedFiles = makeFileTracker();

suite("html file subcommand", () => {
  test("run: converts markdown to HTML and writes output file", async () => {
    const inPath = path.join(logBasePath, "html", "in", "test-post.md");
    const outPath = path.join(logBasePath, "html", "out", "test-post.html");
    touchedFiles.push(inPath, outPath);

    await mkdir(path.dirname(inPath), { recursive: true });
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(inPath, "# Hello World\n\nSome content.", "utf-8");

    await html.subCommands!.file.run!(["test-post"]);

    const output = await readFile(outPath, "utf-8");
    assert.ok(output.includes("Hello World"));
    assert.ok(output.includes("Some content"));
  });

  const invalidFileNames = ["", "   ", "../evil", "nonexistent-post"];

  invalidFileNames.forEach((fileName) => {
    test(`run: throws CommandError for invalid file name "${fileName}"`, async () => {
      await assert.rejects(
        () => html.subCommands!.file.run!([fileName]),
        CommandError,
      );
    });
  });
});

suite("parseFrontmatter", () => {
  test("parses all four fields and separates body", () => {
    const md = `---\ntitle: My Title\ndescription: My description.\ndate: April 28, 2026\nslug: my-title\n---\n\n## Intro\n\nBody content.`;
    const result = parseFrontmatter(md);

    assert.ok(result);
    assert.equal(result.frontmatter.title, "My Title");
    assert.equal(result.frontmatter.description, "My description.");
    assert.equal(result.frontmatter.date, "April 28, 2026");
    assert.equal(result.frontmatter.slug, "my-title");
    assert.ok(result.body.includes("Body content."));
  });

  const invalidInputs = [
    {
      label: "no frontmatter",
      text: "# Just markdown\n\nNo frontmatter here.",
    },
    {
      label: "missing slug",
      text: "---\ntitle: T\ndescription: D\ndate: Jan 1, 2026\n---\n\nBody.",
    },
    {
      label: "missing title",
      text: "---\ndescription: D\ndate: Jan 1, 2026\nslug: s\n---\n\nBody.",
    },
  ];

  invalidInputs.forEach(({ label, text }) => {
    test(`returns undefined for ${label}`, () => {
      assert.equal(parseFrontmatter(text), undefined);
    });
  });
});

suite("runBlog", () => {
  const tempDir = path.join(logBasePath, "html", "blog-test");

  test("converts frontmatter markdown to a full HTML page", async () => {
    const slug = "test-blog-post";
    const mdPath = path.join(tempDir, `${slug}.md`);
    const templatePath = path.join(tempDir, "template.htm");
    const outPath = path.join(tempDir, `${slug}.html`);
    touchedFiles.push(mdPath, templatePath, outPath);

    await mkdir(tempDir, { recursive: true });
    await writeFile(
      mdPath,
      "---\ntitle: Test Title\ndescription: A test post.\ndate: April 28, 2026\nslug: test-blog-post\n---\n\n## Hello\n\nSome content.",
      "utf-8",
    );
    await writeFile(
      templatePath,
      `<html><head><title>{{TITLE}} | Site</title><meta name="description" content="{{DESCRIPTION}}" /><link rel="canonical" href="https://example.com/blog/{{SLUG}}" /></head><body><header class="blog-header">{{HEADER_HTML}}</header><section>{{SECTION_HTML}}</section></body></html>`,
      "utf-8",
    );

    await runBlog(slug, tempDir);

    const output = await readFile(outPath, "utf-8");
    assert.ok(output.includes("Test Title"));
    assert.ok(output.includes("A test post."));
    assert.ok(output.includes("test-blog-post"));
    assert.ok(output.includes("April 28, 2026"));
    assert.ok(output.includes("Hello"));
    assert.ok(output.includes("Some content."));
  });

  const invalidSlugs = ["", "   ", "../evil", "--flag"];

  invalidSlugs.forEach((slug) => {
    test(`blog subcommand throws CommandError for invalid slug "${slug}"`, async () => {
      await assert.rejects(
        () => html.subCommands!.blog.run!([slug]),
        CommandError,
      );
    });
  });

  test("run --blog throws CommandError when md file does not exist", async () => {
    await assert.rejects(
      () => runBlog("nonexistent-slug", tempDir),
      CommandError,
    );
  });
});
