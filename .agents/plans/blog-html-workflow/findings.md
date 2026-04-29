# Findings & Decisions

## Requirements

- Markdown source files must live in `packages/frontend/src/blog/` for version control and agent access
- CLI `html` command needs a `--blog` flag to automate the full template-injection workflow
- Output HTML written directly to `packages/frontend/src/blog/<slug>.html` — no manual copy/paste

## Research Findings

### Current Workflow (manual steps to eliminate)

1. Write `.md` in `packages/cli/logs/html/in/`
2. Run `npm run cli -- html <FILE_NAME>`
3. CLI outputs raw HTML fragment to `packages/cli/logs/html/out/<FILE_NAME>.html`
4. Developer manually:
   - Copies `packages/frontend/src/blog/template.htm` → new `.html` file
   - Pastes `<header>` and `<section>` content from converted file into template
   - Updates `<title>`, `<meta name="description">`, `<link rel="canonical">` in `<head>`
   - Adds a link in `blog.html`
   - Adds entry in `sitemap.xml`

### Key Files

- CLI command: `packages/cli/src/html/html.ts`
- CLI file utilities: `packages/cli/src/utils/fileUtils.ts`
- Blog template: `packages/frontend/src/blog/template.htm`
- Existing blog articles: `packages/frontend/src/blog/*.html`
- CLI entry: `packages/cli/src/index.ts`

### Template Placeholders

- `<title>{UPDATE THE TITLE} | Better Job Board</title>`
- `<meta name="description" content="{UPDATE THE DESCRIPTION}" />`
- `<link rel="canonical" href="https://betterjobboard.net/blog/{UPDATE THE SLUG}" />`
- `<header class="blog-header">{COPY TITLE AND DATE HTML HERE}</header>`
- `<section>{COPY BLOG CONTENT HTML HERE}</section>`

### fileUtils.ts Design

`Place` type uses a `folder` property joined with `basePath` (resolves to `packages/cli/logs/`). Can pass a relative path like `"../../../../packages/frontend/src/blog"` in `folder` to reach the frontend blog folder while keeping all file I/O through the existing abstraction.

### Frontmatter Convention (established)

```yaml
---
title: Why We're Focusing on US-Based Jobs
description: We're narrowing our focus...
date: April 9, 2026
slug: focusing-on-usa-jobs
---
```

## Technical Decisions

| Decision                                                        | Rationale                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| MD file location: `packages/frontend/src/blog/`                 | Version-controlled with frontend; accessible to agents and server |
| Output location: `packages/frontend/src/blog/<slug>.html`       | Co-located with MD source                                         |
| File I/O via `fileUtils.ts` with relative path escaping `logs/` | Consistent with existing patterns                                 |
| Template injection via string replace on sentinels              | Simple, no templating engine; template may be edited freely       |
| Frontmatter parsing: manual regex/string split                  | No new dependencies                                               |
| Flag style: `--blog` on existing `html` command                 | Minimal surface area; consistent with existing command            |

## Resources

- Blog template: `packages/frontend/src/blog/template.htm`
- Existing articles for reference: `packages/frontend/src/blog/*.html`
