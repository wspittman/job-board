# Progress Log

## Session: April 28, 2026

### Phase 1: Establish frontmatter convention

- **Status:** complete
- **Actions taken:** Decided on `title`, `description`, `date`, `slug` fields. Documented in `task_plan.md` and `findings.md`.
- **Files created/modified:** —

### Phase 2: Add `--blog` flag to `html` command

- **Status:** complete
- **Actions taken:** Updated `html.ts` to support `--blog <slug>`. Added `parseFrontmatter()` and `runBlog()` as exported helpers. Standard (no-flag) behavior is unchanged.
- **Files created/modified:** `packages/cli/src/html/html.ts`

### Phase 3: Update template.htm and docs

- **Status:** complete
- **Actions taken:** Replaced verbose placeholder comments in `template.htm` with clean `{{TITLE}}`, `{{DESCRIPTION}}`, `{{SLUG}}`, `{{HEADER_HTML}}`, `{{SECTION_HTML}}` sentinels. Added blog workflow section to `packages/cli/AGENTS.md`.
- **Files created/modified:** `packages/frontend/src/blog/template.htm`, `packages/cli/AGENTS.md`

### Phase 4: Tests

- **Status:** complete
- **Actions taken:** Added `parseFrontmatter` suite (4 cases) and `runBlog` suite (6 cases) to `html.test.ts`. All 86 CLI tests pass. Full pre-checkin passes (lint + format + all tests).
- **Files created/modified:** `packages/cli/test/html/html.test.ts`

## Test Results

| Test                             | Input                                        | Expected                                | Actual  | Status |
| -------------------------------- | -------------------------------------------- | --------------------------------------- | ------- | ------ |
| parseFrontmatter: valid          | MD with all 4 frontmatter fields             | Returns parsed fields + body            | Correct | ✅     |
| parseFrontmatter: no frontmatter | Plain markdown                               | `undefined`                             | Correct | ✅     |
| parseFrontmatter: missing slug   | Frontmatter without slug                     | `undefined`                             | Correct | ✅     |
| parseFrontmatter: missing title  | Frontmatter without title                    | `undefined`                             | Correct | ✅     |
| runBlog: converts md to HTML     | Valid slug + matching `.md` + `template.htm` | Full HTML page with all fields injected | Correct | ✅     |
| runBlog: invalid slugs (4 cases) | `""`, `"   "`, `"../evil"`, `"--flag"`       | `CommandError`                          | Correct | ✅     |
| runBlog: missing md file         | Valid slug, no `.md` file                    | `CommandError`                          | Correct | ✅     |
