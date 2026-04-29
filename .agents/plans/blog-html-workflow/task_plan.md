# Task Plan: Streamline Blog Article HTML Workflow

## Goal

Add `html blog` and `html file` subcommands to the CLI so that blog posts can be authored as frontmatter markdown in `packages/frontend/src/blog/` and converted to full HTML pages with a single command — no manual copy/paste.

## Current Phase

All phases complete.

---

## Context & Findings

### Current Workflow

1. Write `.md` file in `packages/cli/logs/html/in/`
2. Run `npm run cli -- html <FILE_NAME>`
3. CLI converts markdown → raw HTML fragment → saves to `packages/cli/logs/html/out/<FILE_NAME>.html`
4. Developer manually:
   - Copies `packages/frontend/src/blog/template.htm` → new `.html` file
   - Pastes `<header>` and `<section>` content from the converted file into the template
   - Updates `<title>`, `<meta description>`, `<link rel="canonical">` in the `<head>`
   - Adds a link in `blog.html`
   - Adds entry in `sitemap.xml`

### Key Files

- CLI command: `packages/cli/src/html/html.ts`
- CLI file utilities: `packages/cli/src/utils/fileUtils.ts`
- Blog template: `packages/frontend/src/blog/template.htm`
- Existing blog articles: `packages/frontend/src/blog/*.html`
- CLI entry: `packages/cli/src/index.ts`

### Template Structure

The template expects:

- `<title>{UPDATE THE TITLE} | Better Job Board</title>`
- `<meta name="description" content="{UPDATE THE DESCRIPTION}" />`
- `<link rel="canonical" href="https://betterjobboard.net/blog/{UPDATE THE SLUG}" />`
- `<header class="blog-header">{COPY TITLE AND DATE HTML HERE}</header>`
- `<section>{COPY BLOG CONTENT HTML HERE}</section>`

### Markdown Convention (to establish)

To allow the CLI to auto-populate template fields without copy/paste, we need a frontmatter convention in the `.md` files:

```yaml
---
title: Why We're Focusing on US-Based Jobs
description: We're narrowing our focus...
date: April 9, 2026
slug: focusing-on-usa-jobs
---
```

### Where MD files should live

`packages/frontend/src/blog/` — alongside the HTML output. This keeps source and output co-located and version-controlled with the frontend.

### fileUtils.ts design

The `Place` type uses a `folder` property that is joined with `basePath` (which resolves to `packages/cli/logs/`). We can pass `"../../../../packages/frontend/src/blog"` (or similar relative path) in `folder` to escape the `logs/` tree and reach the frontend blog folder. This keeps all file I/O through the existing `fileUtils.ts` abstraction.

---

## Phases

### Phase 1: Establish frontmatter convention

**Status:** `not_started`

- Decide on frontmatter fields: `title`, `description`, `date`, `slug`
- Existing `.md` source files are already maintained on another machine; no need to recreate them here
- Document the expected frontmatter format in the plan and CLI docs

### Phase 2: Add `blog` and `file` subcommands to `html` command

**Status:** `complete`

Implementation:

- `html blog <SLUG>` — reads `packages/frontend/src/blog/<SLUG>.md`, parses frontmatter, injects into `template.htm`, writes `<SLUG>.html` alongside
- `html file <NAME>` — existing generic markdown → HTML fragment behaviour, unchanged
- `parseFrontmatter` returns flat `Blog` object (`{ title, description, date, slug, content }`)
- `runBlog` uses `blogPlace` (via fileUtils) — no `folder` parameter
- Arg validation via shared `validateFileName` util
- Header HTML generated via `markdownToHtml`

### Phase 3: Update template.htm and docs

**Status:** `complete`

- `template.htm` can be freely edited or restructured to make automated injection easier (e.g. replacing verbose placeholder comments with clean sentinel strings)
- Update `packages/cli/AGENTS.md` with the new workflow
- Update or add usage docs in `packages/frontend/AGENTS.md` or `README.md` if relevant

### Phase 4: Tests

**Status:** `complete`

- Unit test for the blog conversion: given a `.md` with frontmatter, assert the output HTML contains expected title, description, slug, header, and section content

### Phase 5: Auto-update `blog.html` and `sitemap.xml`

**Status:** `complete`

- When `html blog <SLUG>` runs, also insert a new `<article class="card">` at the top of `<section class="blog-list">` in `blog.html`
- Also insert a `<url>` entry in `sitemap.xml`
- Both operations are idempotent (skip if slug already present)
- Export `updateBlogIndex` and `updateSitemap` with optional `filePath` override for testability
- Add unit tests for both helpers and update the `runBlog` integration test

---

## Decisions

| Decision                 | Choice                                                      | Reason                                                            |
| ------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| MD file location         | `packages/frontend/src/blog/`                               | Version-controlled with frontend; accessible to agents and server |
| Output file location     | `packages/frontend/src/blog/<slug>.html`                    | Co-located with MD source                                         |
| File I/O                 | `fileUtils.ts` with relative `folder` path escaping `logs/` | Consistent with existing patterns                                 |
| Template field injection | String replace on sentinels in `template.htm`               | Simple, no templating engine; template may be edited freely       |
| Frontmatter parsing      | Manual regex/string split                                   | No new dependencies                                               |
| Flag style               | `--blog` flag on existing `html` command                    | Minimal surface area change; consistent with existing command     |

---

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| —     | —       | —          |
