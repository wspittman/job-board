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

_Phase 3 (Utility Module) is **pending** and awaiting review._
