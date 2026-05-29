# Progress Log

## Session: 2026-05-29

### Planning and Discovery

- **Status:** complete
- **Started:** 2026-05-29 11:08 America/Los_Angeles

#### Actions Taken

- Read the `planning-with-files` skill instructions and templates.
- Inspected existing `.agents/plans` layout.
- Located the current backend `ORDER BY` implementation in `packages/backend/src/controllers/job.ts`.
- Traced the filter flow through frontend `FilterModel`, filter-pane definitions, API request construction, backend validation, and backend query construction.
- Created this plan folder and planning files.

#### Files Created/Modified

- `.agents/plans/configurable-job-result-order/task_plan.md`
- `.agents/plans/configurable-job-result-order/findings.md`
- `.agents/plans/configurable-job-result-order/progress.md`

#### Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Not run | Planning-only change | No code tests required | Not run | skipped |

### Phase 1: Shared Order Contract

- **Status:** complete
- **Started:** 2026-05-29 11:14 America/Los_Angeles
- **Completed:** 2026-05-29 11:16 America/Los_Angeles

#### Actions Taken

- Added backend `JobOrderBy` enum/type and `Filters.orderBy`.
- Added backend `useFilters` validation for supported `orderBy` values.
- Added frontend `JobOrderBy` type, options, parser, and label helpers.
- Added `FilterModelApi.orderBy` to the frontend API contract.
- Updated backend validator tests and frontend enum tests.
- Stopped before backend query mapping or filter-pane UI changes, per request.

#### Files Created/Modified

- `.agents/plans/configurable-job-result-order/task_plan.md`
- `.agents/plans/configurable-job-result-order/findings.md`
- `.agents/plans/configurable-job-result-order/progress.md`
- `packages/backend/src/models/enums.ts`
- `packages/backend/src/models/clientModels.ts`
- `packages/backend/src/middleware/inputValidators.ts`
- `packages/backend/test/middleware/inputValidators.test.ts`
- `packages/frontend/src/api/apiEnums.ts`
- `packages/frontend/src/api/apiTypes.ts`
- `packages/frontend/src/api/apiEnums.test.ts`

#### Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Backend tests | `npm run test --workspace=backend -- test/middleware/inputValidators.test.ts` | Pass | Pass | passed |
| Frontend enum tests | `npm run test --workspace=frontend -- src/api/apiEnums.test.ts` | Pass | Pass | passed |
| Backend build | `npm run build --workspace=backend` | Pass | Pass | passed |
| Frontend build | `npm run build --workspace=frontend` | Pass | Pass | passed |

### Phase 2: Backend Query Ordering

- **Status:** complete
- **Started:** 2026-05-29 11:24 America/Los_Angeles
- **Completed:** 2026-05-29 11:30 America/Los_Angeles

#### Actions Taken

- Added `applyJobOrder` in `packages/backend/src/controllers/job.ts`.
- Replaced `query.orderBy("postTS", "DESC")` with the allow-listed helper.
- Mapped `post_time` to `postTS DESC`.
- Mapped `highest_salary` to `salaryRange.min DESC`.
- Mapped `lowest_experience` to `requiredExperience ASC`.
- Added controller tests for supported orderings, missing order, and invalid runtime input fallback.
- Verified mock DB behavior for missing salary and missing experience fields.
- Stopped before filter-pane UI and frontend URL parsing work, per request.

#### Files Created/Modified

- `.agents/plans/configurable-job-result-order/task_plan.md`
- `.agents/plans/configurable-job-result-order/findings.md`
- `.agents/plans/configurable-job-result-order/progress.md`
- `packages/backend/src/controllers/job.ts`
- `packages/backend/test/controllers/job.test.ts`

#### Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Backend controller tests | `npm run test --workspace=backend -- test/controllers/job.test.ts` | Pass | Pass | passed |
| Backend validator tests | `npm run test --workspace=backend -- test/middleware/inputValidators.test.ts` | Pass | Pass | passed |
| Backend build | `npm run build --workspace=backend` | Pass | Pass | passed |
| Backend lint | `npm run lint --workspace=backend` | Pass | Pass | passed |

#### Review Correction

- **Status:** complete
- **Completed:** 2026-05-29 after Phase 2 review

Removed the `IS_DEFINED` field guards after review clarified that MockDB's ordering is wrong for this case. Real Cosmos DB sorts missing numeric values below defined numbers, so missing salary naturally appears last for `DESC`, and missing required experience naturally appears first for `ASC`. Added a code comment in `packages/backend/src/controllers/job.ts` so future order-by additions preserve this behavior intentionally.

### Phase 3: Frontend Filter Pane

- **Status:** complete
- **Started:** 2026-05-29 15:47 America/Los_Angeles
- **Completed:** 2026-05-29 15:55 America/Los_Angeles

#### Actions Taken

- Added an `Order By` select in a new `Results` filter group.
- Added `anyLabel` support to `jb-form-select` so this select can show `Newest` for the empty/default value while other selects continue showing `Any`.
- Parsed `orderBy` in `FilterModel` from URL strings, form data, and API objects.
- Serialized only non-default orderings; `post_time` normalizes to empty/default so the default stays chipless.
- Added friendly order chips for non-default values.
- Added a tooltip clue that lowest required experience places jobs with no listed experience requirement first.
- Verified natural-language filter updates preserve an existing manual `orderBy` selection.
- Stopped before Phase 4 final verification and commit/pre-checkin work, per request.

#### Files Created/Modified

- `.agents/plans/configurable-job-result-order/task_plan.md`
- `.agents/plans/configurable-job-result-order/findings.md`
- `.agents/plans/configurable-job-result-order/progress.md`
- `packages/frontend/src/api/filterModel.ts`
- `packages/frontend/src/api/filterModel.test.ts`
- `packages/frontend/src/components/form-element.ts`
- `packages/frontend/src/components/form-select.ts`
- `packages/frontend/src/components/form-select.test.ts`
- `packages/frontend/src/jobs/filters/filters.ts`
- `packages/frontend/src/jobs/filters/filters.test.ts`

#### Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Filter model tests | `npm run test --workspace=frontend -- src/api/filterModel.test.ts` | Pass | Pass | passed |
| Filter pane tests | `npm run test --workspace=frontend -- src/jobs/filters/filters.test.ts` | Pass | Pass | passed |
| Form select tests | `npm run test --workspace=frontend -- src/components/form-select.test.ts` | Pass | Pass | passed |
| Frontend build | `npm run build --workspace=frontend` | Pass | Pass | passed |
| Frontend lint | `npm run lint --workspace=frontend` | Pass | Pass | passed |

#### Follow-Up Review Adjustment

- **Status:** complete
- **Completed:** 2026-05-29 16:20 America/Los_Angeles

Removed the custom `anyLabel` extension from `jb-form-select`, restored the standard `Any` empty option, and changed the Order By select to include all three explicit options: `Post Date`, `Pay Rate`, and `Required Experience`. `Post Date` now round-trips as `orderBy=post_time`, while order-only models still count as empty for search execution.

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Form select behavior | `npm run test --workspace=frontend -- src/components/form-select.test.ts` | Pass | Pass | passed |
| Filter pane behavior | `npm run test --workspace=frontend -- src/jobs/filters/filters.test.ts` | Pass | Pass | passed |
| Filter model behavior | `npm run test --workspace=frontend -- src/api/filterModel.test.ts` | Pass | Pass | passed |
| Jobs page order-only behavior | `npm run test --workspace=frontend -- src/jobs/jobs.test.ts` | Pass | Pass | passed |
| Frontend tests | `npm run test --workspace=frontend` | Pass | 21 files / 232 tests passed | passed |
| Frontend build | `npm run build --workspace=frontend` | Pass | Pass | passed |
| Frontend lint | `npm run lint --workspace=frontend` | Pass | Pass | passed |
| Frontend tests | `npm run test --workspace=frontend` | Pass | 21 files / 227 tests passed | passed |
| Browser check | Browser plugin/dev server | Inspect `/jobs` visually | Browser tool unavailable; background dev server failed to stay up through PowerShell Start-Process | skipped |

#### Review Adjustments

- **Status:** complete
- **Completed:** 2026-05-29 16:05 America/Los_Angeles

Moved the `Results` group to the bottom of the filter pane, renamed the visible sort labels to `Post Date`, `Pay Rate`, and `Required Experience`, and changed `FilterModel.isEmpty()` so order-only changes update the URL/chips but do not trigger a job search. Added targeted tests for group order, labels, filter emptiness, and the jobs page no-fetch behavior.

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| API enum labels | `npm run test --workspace=frontend -- src/api/apiEnums.test.ts` | Pass | Pass | passed |
| Filter model behavior | `npm run test --workspace=frontend -- src/api/filterModel.test.ts` | Pass | Pass | passed |
| Filter pane behavior | `npm run test --workspace=frontend -- src/jobs/filters/filters.test.ts` | Pass | Pass | passed |
| Jobs page order-only behavior | `npm run test --workspace=frontend -- src/jobs/jobs.test.ts` | Pass | Pass | passed |
| Form select behavior | `npm run test --workspace=frontend -- src/components/form-select.test.ts` | Pass | Pass | passed |
| Frontend tests | `npm run test --workspace=frontend` | Pass | 21 files / 231 tests passed | passed |
| Frontend build | `npm run build --workspace=frontend` | Pass | Pass | passed |
| Frontend lint | `npm run lint --workspace=frontend` | Pass | Pass | passed |
