import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, suite, test } from "node:test";
import {
  html,
  parseFrontmatter,
  runBlog,
  updateBlogIndex,
  updateSitemap,
} from "../../src/html/html.ts";
import { CommandError } from "../../src/types.ts";
import { type Place } from "../../src/utils/fileUtils.ts";
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
  test("parses all three fields and separates body", () => {
    const md = `---\ntitle: My Title\ndescription: My description.\ndate: April 28, 2026\n---\n\n## Intro\n\nBody content.`;
    const result = parseFrontmatter(md);

    assert.ok(result);
    assert.equal(result.title, "My Title");
    assert.equal(result.description, "My description.");
    assert.equal(result.date, "April 28, 2026");
    assert.ok(result.content.includes("Body content."));
  });

  const invalidInputs = [
    {
      label: "no frontmatter",
      text: "# Just markdown\n\nNo frontmatter here.",
    },
    {
      label: "missing date",
      text: "---\ntitle: T\ndescription: D\n---\n\nBody.",
    },
    {
      label: "missing title",
      text: "---\ndescription: D\ndate: Jan 1, 2026\n---\n\nBody.",
    },
  ];

  invalidInputs.forEach(({ label, text }) => {
    test(`returns undefined for ${label}`, () => {
      assert.equal(parseFrontmatter(text), undefined);
    });
  });

  test("escapes HTML special characters in frontmatter values", () => {
    const md = `---\ntitle: "Quotes" & <Tags>\ndescription: A "desc" with <b>bold</b> & more.\ndate: May 11, 2026\n---\n\nBody.`;
    const result = parseFrontmatter(md);

    assert.ok(result);
    assert.equal(result.title, "&quot;Quotes&quot; &amp; &lt;Tags&gt;");
    assert.equal(
      result.description,
      "A &quot;desc&quot; with &lt;b&gt;bold&lt;/b&gt; &amp; more.",
    );
    assert.equal(result.date, "May 11, 2026");
  });
});

suite("runBlog", () => {
  const blogPath = path.join(
    logBasePath,
    "../../../packages/frontend/src/blog",
  );

  // Temp places to avoid touching real frontend files during tests
  const tmpBlogIndexPlace: Place = {
    group: "html",
    stage: "in",
    folder: "../..",
    file: "test-run-blog-index",
  };
  const tmpSitemapPlace: Place = {
    group: "html",
    stage: "in",
    folder: "../..",
    file: "test-run-blog-sitemap",
  };
  const tmpBlogIndexPath = path.join(logBasePath, "test-run-blog-index.html");
  const tmpSitemapPath = path.join(logBasePath, "test-run-blog-sitemap.xml");

  test("converts frontmatter markdown to a full HTML page", async () => {
    const slug = "test-blog-post";
    const mdPath = path.join(blogPath, `${slug}.md`);
    const outPath = path.join(blogPath, `${slug}.html`);
    touchedFiles.push(mdPath, outPath, tmpBlogIndexPath, tmpSitemapPath);

    await writeFile(
      mdPath,
      "---\ntitle: Test Title\ndescription: A test post.\ndate: April 28, 2026\n---\n\n## Hello\n\nSome content.",
      "utf-8",
    );

    // Seed temp files with minimal valid content
    await writeFile(
      tmpBlogIndexPath,
      `<section class="blog-list">\n</section>`,
      "utf-8",
    );
    await writeFile(
      tmpSitemapPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset></urlset>`,
      "utf-8",
    );

    await runBlog(slug, {
      blogIndex: tmpBlogIndexPlace,
      sitemap: tmpSitemapPlace,
    });

    const output = await readFile(outPath, "utf-8");
    assert.ok(output.includes("Test Title"));
    assert.ok(output.includes("A test post."));
    assert.ok(output.includes("test-blog-post"));
    assert.ok(output.includes("April 28, 2026"));
    assert.ok(output.includes("Hello"));
    assert.ok(output.includes("Some content."));

    const blogIndex = await readFile(tmpBlogIndexPath, "utf-8");
    assert.ok(blogIndex.includes("/blog/test-blog-post"));
    assert.ok(blogIndex.includes("Test Title"));

    const sitemap = await readFile(tmpSitemapPath, "utf-8");
    assert.ok(sitemap.includes("/blog/test-blog-post"));
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

  test("throws CommandError when md file does not exist", async () => {
    await assert.rejects(() => runBlog("nonexistent-slug"), CommandError);
  });
});

suite("updateBlogIndex", () => {
  // Resolves to logs/test-blog-index.html via folder: "../.." escaping logs/html/in
  const tmpPlace: Place = {
    group: "html",
    stage: "in",
    folder: "../..",
    file: "test-blog-index",
  };
  const tmpPath = path.join(logBasePath, "test-blog-index.html");
  const minimalHtml = [
    `<!doctype html>`,
    `<html>`,
    `  <body>`,
    `    <section class="blog-list">`,
    `      <article class="card"><h2>Existing</h2></article>`,
    `    </section>`,
    `  </body>`,
    `</html>`,
  ].join("\n");

  test("inserts card at top of blog list", async () => {
    touchedFiles.push(tmpPath);
    await writeFile(tmpPath, minimalHtml, "utf-8");

    await updateBlogIndex(
      "new-post",
      {
        title: "New Post",
        description: "A new post.",
        date: "April 29, 2026",
        content: "",
      },
      tmpPlace,
    );

    const result = await readFile(tmpPath, "utf-8");
    assert.ok(result.includes(`/blog/new-post`));
    assert.ok(result.includes("New Post"));
    assert.ok(result.includes("April 29, 2026"));
    assert.ok(result.includes("A new post."));
    // new card appears before existing content
    assert.ok(result.indexOf("/blog/new-post") < result.indexOf("Existing"));
  });

  test("is idempotent when slug already present", async () => {
    touchedFiles.push(tmpPath);
    const withSlug = minimalHtml.replace(
      `<section class="blog-list">`,
      `<section class="blog-list">\n      <a href="/blog/already-here">link</a>`,
    );
    await writeFile(tmpPath, withSlug, "utf-8");

    await updateBlogIndex(
      "already-here",
      {
        title: "Already Here",
        description: "Desc.",
        date: "April 29, 2026",
        content: "",
      },
      tmpPlace,
    );

    const result = await readFile(tmpPath, "utf-8");
    assert.equal(
      result.split("/blog/already-here").length - 1,
      1,
      "slug should appear exactly once",
    );
  });
});

suite("updateSitemap", () => {
  // Resolves to logs/test-sitemap.xml via folder: "../.." escaping logs/html/in
  const tmpPlace: Place = {
    group: "html",
    stage: "in",
    folder: "../..",
    file: "test-sitemap",
  };
  const tmpPath = path.join(logBasePath, "test-sitemap.xml");
  const minimalXml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <url>`,
    `    <loc>https://betterjobboard.net/</loc>`,
    `  </url>`,
    `</urlset>`,
  ].join("\n");

  test("inserts URL entry before closing urlset tag", async () => {
    touchedFiles.push(tmpPath);
    await writeFile(tmpPath, minimalXml, "utf-8");

    await updateSitemap("new-post", tmpPlace);

    const result = await readFile(tmpPath, "utf-8");
    assert.ok(result.includes("https://betterjobboard.net/blog/new-post"));
    assert.ok(result.includes("<changefreq>monthly</changefreq>"));
    assert.ok(result.includes("<priority>0.2</priority>"));
    assert.ok(result.endsWith("</urlset>"));
  });

  test("is idempotent when slug already present", async () => {
    touchedFiles.push(tmpPath);
    const withSlug = minimalXml.replace(
      `</urlset>`,
      `  <url><loc>https://betterjobboard.net/blog/already-here</loc></url>\n</urlset>`,
    );
    await writeFile(tmpPath, withSlug, "utf-8");

    await updateSitemap("already-here", tmpPlace);

    const result = await readFile(tmpPath, "utf-8");
    assert.equal(
      result.split("/blog/already-here").length - 1,
      1,
      "slug should appear exactly once",
    );
  });
});
