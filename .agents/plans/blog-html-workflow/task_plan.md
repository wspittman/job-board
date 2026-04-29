# Task Plan: Streamline Blog Article HTML Workflow

## Goal

Add a `--blog` flag (or subcommand) to the CLI `html` command so that:

## Current Phase

Phase 1: Establish frontmatter convention
1. Markdown source files live in the frontend package (`packages/frontend/src/blog/`) for version control and agent access
2. The command writes the converted HTML directly to the frontend blog folder using the `template.htm` structure — no copy/paste required

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

### Phase 2: Add `--blog` flag to `html` command
**Status:** `not_started`

Tasks:
- Parse optional `--blog` flag in `html.ts`
- When flag present:
  - Resolve input path: `packages/frontend/src/blog/<slug>.md`
  - Parse YAML frontmatter (title, description, date, slug)
  - Convert body markdown → HTML fragment
  - Read `template.htm`
  - Substitute placeholders with frontmatter values and HTML fragment
  - Write output to `packages/frontend/src/blog/<slug>.html`
- When flag absent: existing behavior unchanged

Dependencies:
- Parse frontmatter manually with a simple regex/string split — no new dependencies needed.

### Phase 3: Update template.htm and docs
**Status:** `not_started`

- `template.htm` can be freely edited or restructured to make automated injection easier (e.g. replacing verbose placeholder comments with clean sentinel strings)
- Update `packages/cli/AGENTS.md` with the new workflow
- Update or add usage docs in `packages/frontend/AGENTS.md` or `README.md` if relevant

### Phase 4: Tests
**Status:** `not_started`

- Unit test for the blog conversion: given a `.md` with frontmatter, assert the output HTML contains expected title, description, slug, header, and section content

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| MD file location | `packages/frontend/src/blog/` | Version-controlled with frontend; accessible to agents and server |
| Output file location | `packages/frontend/src/blog/<slug>.html` | Co-located with MD source |
| File I/O | `fileUtils.ts` with relative `folder` path escaping `logs/` | Consistent with existing patterns |
| Template field injection | String replace on sentinels in `template.htm` | Simple, no templating engine; template may be edited freely |
| Frontmatter parsing | Manual regex/string split | No new dependencies |
| Flag style | `--blog` flag on existing `html` command | Minimal surface area change; consistent with existing command |

---

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| — | — | — |
