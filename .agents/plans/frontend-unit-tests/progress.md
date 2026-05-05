# Progress Log

## Session: 2026-04-28

### Plan conformance review

- **Status:** complete
- **Actions taken:**
  - Reviewed plan against `planning-with-files` skill requirements.
  - Added `## Current Phase` section to `task_plan.md`.
  - Added `**Status:** pending` markers to all five phases in `task_plan.md`.
  - Added `## Key Questions`, `## Decisions Made`, and `## Errors Encountered` sections to `task_plan.md`.
  - Created `findings.md` from research embedded in the original plan.
  - Created `progress.md` (this file).
- **Files created/modified:**
  - `.agents/plans/frontend-unit-tests/task_plan.md` (updated)
  - `.agents/plans/frontend-unit-tests/findings.md` (created)
  - `.agents/plans/frontend-unit-tests/progress.md` (created)

---

---

## Session: 2026-04-30

### Phase 1 — Data Model Logic

- **Status:** complete
- **Test files created:**
  - `src/api/apiEnums.test.ts` — table-driven tests for all label converters and `toCurrencyFormat`
  - `src/api/filterModel.test.ts` — covers `fromLocationSearchString`, `fromFormData`, `fromApi`, `toLocationSearchString` round-trip, `toFriendlyStrings`, `isEmpty`, `isSavedJob`, and normalization helpers
  - `src/api/jobModel.test.ts` — covers `getDisplayDetail`, `getDisplayFacets` (long and short), `applyUrl`, `bookmarkUrl`
- **Test count:** 143 (up from 76)
- **Pre-checkin:** green (lint, format, tests all pass)
- **Key convention learned:** `vi.mocked(obj.method)` must be on one line for `eslint-disable-next-line @typescript-eslint/unbound-method` to apply correctly.

_Phase 2 (Remaining Reusable Components) is **pending** and awaiting review._

---

## Session: 2026-05-04

### Phase 2 — Remaining Reusable Components

- **Status:** complete
- **Test files created:**
  - `src/components/job-chips.test.ts` — covers chip count, label matching, useShort flag, and re-init replacement
  - `src/components/nl-search.test.ts` — covers initial disabled state, button enable on input, loading state, successful NL_SEARCH_RESULT emission, error display, and redirect navigation
- **Test count:** 153 (up from 143)
- **Pre-checkin:** green
- **Non-obvious conventions learned:**
  - `FilterModel` stores all data in a private `#filters` field; use public methods (e.g. `toLocationSearchString()`) for assertions rather than `toMatchObject`
  - `window.location.assign` is non-configurable in jsdom — use `vi.stubGlobal("location", { assign: vi.fn(), ... })` and pair with `afterEach(vi.unstubAllGlobals)`

_Phase 4 (Page-Level Rendering Components) is **pending** and awaiting review._

---

## Session: 2026-05-04 (continued)

### Phase 4 — Page-Level Rendering Components

- **Status:** complete
- **Test files created:**
  - `src/jobs/results/message-card.test.ts` — covers `countToMessage` table (via `create`), explicit message content, `error-card` class, and default count behavior
  - `src/jobs/results/job-card.test.ts` — covers `create` text population, `isSelected` true/false states, idempotency guard, and click event emission
  - `src/home/stats.test.ts` — covers count rendering, visibility after load, disconnected guard, and error swallowing
  - `src/faq/faq.test.ts` — covers timestamp text/display on success and silent error swallowing; uses `vi.resetModules()` + dynamic import pattern for top-level module code
- **Test count:** 177 (up from 157)
- **Pre-checkin:** green
- **Non-obvious conventions learned:**
  - `vi.clearAllMocks()` (from testSetup) does NOT reset `mockResolvedValue` implementations — leaks can corrupt subsequent `beforeEach` side effects when `connectedCallback` fires on element append; use `vi.resetAllMocks()` in `beforeEach` for components whose `connectedCallback` calls async methods
  - When `connectedCallback` triggers `onLoad` in `beforeEach`, element must be in the DOM for the `isConnected` guard to pass; test the disconnected guard by creating a fresh unconnected element rather than trying to time a removal before promise resolution
  - Top-level `await` module code (like `faq.ts`) requires `vi.resetModules()` in `beforeEach` + dynamic `import()` inside each test to re-execute the module per test

_Phase 5 (Complex Page Orchestrators) is **pending** and awaiting review._
