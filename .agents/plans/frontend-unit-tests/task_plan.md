# Frontend Unit Test Improvement Plan

## Goal

Expand the frontend test suite from its current 7-file coverage of base form components into a comprehensive set that covers the data model layer, remaining reusable components, utility modules, and page-level components — prioritized by value and testability.

## Current State

- **7 test files**, all in `src/components/`
- Coverage: `componentBase`, `chip`, `form-combobox`, `form-element`, `form-input`, `form-select`, `form-textarea`
- ~30 of 39 source files have no tests
- No coverage of: data models, API layer, utilities, or any page components

## Current Phase

Phase 5 — Complex Page Orchestrators (Targeted Only) (**complete**)

## What to Skip (permanently)

| File                            | Reason                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `api.ts`                        | TanStack Query wrapper; integration-level, requires network or complex fetch mocking |
| `apiTypes.ts`                   | Type-only; nothing to assert                                                         |
| `blog.ts`                       | Imports styles only; no logic                                                        |
| `heroIcons.ts`                  | Decorative SVG component; no data or behavior logic                                  |
| `home.ts`                       | Entry point; orchestrates lazy loads via `requestIdleCallback`; no extractable logic |
| `detail-embed.ts`               | Passive rendering wrapper; no data transformation                                    |
| `testSetup.ts` / `testUtils.ts` | Test infrastructure; indirectly exercised by all tests                               |

---

## Phase 1 — Data Model Logic

**Status:** complete

**Rationale:** Pure TypeScript logic with zero DOM dependencies. Highest density of test value per line of code. No mocking needed for `filterModel`; light mocking for `jobModel`.

### 1a. `src/api/filterModel.test.ts`

`FilterModel` is the most testable file in the codebase. All methods are pure transformations of structured input.

| Test area                  | What to assert                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `fromLocationSearchString` | Parses URL search strings into typed fields; case-insensitive keys; unknown keys ignored                   |
| `fromFormData`             | Reads FormData entries into correctly-typed fields                                                         |
| `fromApi`                  | Converts `FilterModelApi` object; handles nulls                                                            |
| `toLocationSearchString`   | Round-trip: parse then serialize produces a canonical query string                                         |
| `toFriendlyStrings`        | Each `FilterModelKey` maps to the expected human label; `isSavedJob` collapses to single "Saved Job" entry |
| `isEmpty()`                | True when no filters set; false when at least one field present                                            |
| `isSavedJob()`             | True only when both `companyId` and `jobId` are non-empty                                                  |
| Normalization helpers      | `normSearchString` drops values < 3 chars; `normNumber` rejects negatives and NaN; `normIdString` trims    |

Use `test.for(...)` tables for normalization edge cases and for the `toFriendlyStrings` key-mapping cases.  
`metadataModel.getCompanyFriendlyName` should be mocked via `vi.spyOn` for the `companyId` friendly-string test.

### 1b. `src/api/jobModel.test.ts`

`JobModel` wraps a raw API object and formats it for display. Focus on `getDisplayFacets` and `getDisplayDetail`; skip `search()` (uses `api.fetchJobs`).

| Test area                 | What to assert                                                         |
| ------------------------- | ---------------------------------------------------------------------- |
| `getDisplayDetail`        | Returns `title`, `company` (friendly name), `summary` from raw job     |
| `getDisplayFacets(false)` | Full labels for location, remote, salary, stage, etc.                  |
| `getDisplayFacets(true)`  | Short labels trim city suffix; recent posts drop from primary position |
| `applyUrl`                | Appends storage IDs as query params; base path uses job `applyUrl`     |
| `bookmarkUrl`             | Constructs correct `companyId`/`jobId` URL from `location.origin`      |

Mock dependencies: `api.fetchJobs` (not needed if `search()` is skipped), `metadataModel.getCompanyFriendlyName`, `getStorageIds` from `storage`.

### 1c. `src/api/apiEnums.test.ts`

Label conversion functions (`toWorkTimeBasisLabel`, `toJobFamilyLabel`, etc.) are single-line switch statements. A single dense `test.for` table per function is sufficient. Low effort, good regression guard.

---

## Phase 2 — Remaining Reusable Components

**Status:** complete

**Rationale:** Same test infrastructure and conventions as the existing 7 component tests. Low ramp-up cost.

### 2a. `src/components/job-chips.test.ts`

`JobChips.init()` calls `job.getDisplayFacets()` and renders the result as `Chip` children.

| Test area                       | What to assert                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| Renders correct number of chips | Length of `container` children equals `getDisplayFacets()` output length |
| Chip labels                     | Each child chip's text matches the corresponding facet string            |
| `useShort=true`                 | Calls `getDisplayFacets(true)`                                           |
| Re-init replaces children       | Subsequent `init()` call removes old chips                               |

Create a mock `JobModel` object with a controlled `getDisplayFacets` return value; do not construct a real one.

### 2b. `src/components/nl-search.test.ts`

`NLSearch` has the most behavior of the untested components: disabled state, loading state, API call, error display, and redirect mode.

| Test area                        | What to assert                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Update button disabled initially | Button is disabled when textarea is empty                                             |
| Update button enabled on input   | Entering a query value enables the button                                             |
| Loading state                    | Button text changes to "Searching…" and both inputs are disabled during API call      |
| Successful result                | `NL_SEARCH_RESULT` custom event is emitted with the returned `FilterModel`            |
| Error state                      | Error element becomes visible when `api.interpretQuery` throws                        |
| Redirect mode                    | With `redirect` attribute, listens for `NL_SEARCH_RESULT` and calls `location.assign` |

Mock `api.interpretQuery` with `vi.spyOn`. Use `vi.fn` for `location.assign` in redirect mode.

---

## Phase 3 — Utility Module

**Status:** complete

### 3a. `src/utils/storage.test.ts`

`getStorageIds` has branching on target type and error recovery. JSDOM provides `localStorage`/`sessionStorage`, so minimal setup is needed.

| Test area                        | What to assert                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| First call generates IDs         | `visitorId` and `sessionId` are non-empty strings written to storage                               |
| Subsequent call returns same IDs | IDs are stable across calls within the same storage state                                          |
| `target="headers"`               | Returns `Jb-Visitor-Id` / `Jb-Session-Id` keys instead of plain names                              |
| Storage error                    | When storage throws (simulate with `vi.spyOn`), result omits the affected key rather than throwing |

Note: The module-level `beacon()` call executes on import. Stub `navigator.sendBeacon` in `testSetup.ts` or at the top of this test file before importing the module.

---

## Phase 4 — Page-Level Rendering Components

**Status:** complete

**Rationale:** These components have clear inputs/outputs and testable behavior, but require mocking API/model dependencies. Each file is self-contained enough to test in isolation.

### 4a. `src/jobs/results/message-card.test.ts`

`countToMessage` is pure logic; `MessageCard.create` is a factory with measurable DOM output.

| Test area                                  | What to assert                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `countToMessage` table                     | -1 → `AddFilters`; 0 → `NoMatches`; 24 → `PartialMatches`; any other → `AllMatches` |
| `MessageCard.create` with explicit message | Title/subtitle/body text match the message content record                           |
| Error variant                              | Container gains `error-card` CSS class                                              |
| Count-derived message                      | Passing `count` without `message` picks the right variant                           |

### 4b. `src/jobs/results/job-card.test.ts`

`JobCard` has a factory, an `isSelected` setter, and an event.

| Test area          | What to assert                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `JobCard.create`   | `title`, `company`, `summary` set on element; chips initialized from `job.getDisplayFacets` |
| `isSelected=true`  | Container has `is-selected` class and `aria-pressed="true"`                                 |
| `isSelected=false` | Class and attribute reflect false state                                                     |
| Toggle idempotency | Setting same value twice does not re-apply class changes                                    |
| Click emits event  | Clicking the element fires `JOB_CARD_SELECTED` with `job.id` as detail                      |

### 4c. `src/home/stats.test.ts`

`Stats.onLoad` is async and guards against disconnected elements.

| Test area          | What to assert                                                               |
| ------------------ | ---------------------------------------------------------------------------- |
| Counts rendered    | `metadataModel.getCountStrings()` mock returns counts; element texts are set |
| Becomes visible    | `style.display` is `"block"` after successful load                           |
| Disconnected guard | If element is removed before resolution, texts are not set (no error)        |
| Error swallowing   | If `getCountStrings()` rejects, element remains hidden; no thrown error      |

### 4d. `src/faq/faq.ts` → `src/faq/faq.test.ts`

Verify the timestamp display and error path (if the component has non-trivial logic beyond a single `metadataModel` call — confirm by reading the file before starting).

---

## Phase 5 — Complex Page Orchestrators (Targeted Only)

**Status:** complete

**Rationale:** `jobs.ts`, `filters.ts`, `results.ts`, and `details.ts` coordinate many sub-components and events. Full coverage is impractical without significant test infrastructure investment. Limit to critical behaviors that are isolated enough to test cleanly.

### 5a. `src/jobs/results/results.test.ts` (targeted)

| Test area                  | What to assert                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Job list rendering         | Given an array of `JobModel` mocks, correct number of `job-card` elements rendered |
| Selected card highlighting | When a job ID is marked selected, the matching card receives `isSelected=true`     |
| Empty state                | No jobs → `message-card` rendered with count=0                                     |

### 5b. `src/jobs/filters/filters.test.ts` (targeted)

| Test area                              | What to assert                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Form submission produces `FilterModel` | Submitting the form fires an event containing a `FilterModel` with the entered values |
| Clear button resets fields             | Clicking clear zeroes out filter form fields                                          |

### 5c. `src/jobs/jobs.test.ts` (targeted)

Only test behaviors with a clear cause/effect that doesn't require reconstructing the entire page DOM:

| Test area                          | What to assert                                             |
| ---------------------------------- | ---------------------------------------------------------- |
| Job selection updates details pane | `JOB_CARD_SELECTED` event triggers details pane population |
| Filter update triggers search      | Filter update event triggers a new `JobModel.search` call  |

---

## Key Questions

_None — plan is fully specified._

## Decisions Made

| Decision                                                   | Rationale                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Skip `api.ts`, `apiTypes.ts`, and 5 other files            | Integration-level, type-only, or passive rendering; see "What to Skip" table |
| Execution order: 1 → 3 → 2 → 4 → 5                         | Prioritized by ROI; Phase 3 is a quick win before Phase 2 setup              |
| Use `test.for(...)` for normalization edge cases           | Dense tables reduce boilerplate for parameterized assertions                 |
| Mock `metadataModel.getCompanyFriendlyName` via `vi.spyOn` | Isolates model logic from metadata service calls                             |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |

## Suggested Execution Order

1. Phase 1 — highest ROI, no DOM setup required
2. Phase 3 — quick win, uses existing JSDOM environment
3. Phase 2 — follows existing conventions exactly
4. Phase 4 — moderate effort, clear expected outputs
5. Phase 5 — defer until Phases 1–4 are stable; revisit if regressions motivate it

## Definition of Done (per phase)

- All new test files pass `npm run test --workspace=frontend`
- `npm run pre-checkin` passes (lint + format + tests)
- No new production dependencies introduced
