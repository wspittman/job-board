# Findings & Decisions

## Requirements

- Add a filter-pane UI control for selecting result ordering among known values.
- Send the selected ordering to the backend with the other filters.
- Use the selected ordering in the backend `ORDER BY`.
- Preserve current behavior: searches currently always order by post time.

## Research Findings

- Backend search route is `GET /jobs`, wired in `packages/backend/src/routes/routes.ts` through `jsonRoute(getJobs, useFilters, toClientJobs)`.
- Backend filter validation happens in `packages/backend/src/middleware/inputValidators.ts` via `FiltersSchema`; invalid optional fields are caught and stripped through `soft(...)` helpers.
- Backend filter shape is `Filters` in `packages/backend/src/models/clientModels.ts`.
- Backend query construction is in `packages/backend/src/controllers/job.ts`. `readJobsByFilters` currently ends with `query.orderBy("postTS", "DESC").build()`.
- Frontend API search goes through `packages/frontend/src/api/jobModel.ts`, which sends `FilterModel.toLocationSearchString()` to `api.fetchJobs`.
- Frontend filter state lives in `packages/frontend/src/api/filterModel.ts`; it parses from form data, URL search strings, and API objects, then serializes back to URL query strings.
- Frontend filter controls are data-driven from `filterDefs` in `packages/frontend/src/jobs/filters/filters.ts`.
- Frontend option helpers for enums live in `packages/frontend/src/api/apiEnums.ts`.
- Existing backend tests cover validator behavior in `packages/backend/test/middleware/inputValidators.test.ts` and location query helper behavior in `packages/backend/test/controllers/job.test.ts`.
- The `job` Cosmos container currently has no explicit index exclusions in `packages/backend/src/db/db.ts`, so nested salary ordering may work with the default indexing policy, but missing values should still be verified.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Add `orderBy` to existing filter models | Reuses the established URL, form, event, and backend validation pipeline. |
| Use API values like `post_time` and `highest_salary` | Values are stable and user-intent oriented, unlike database field paths. |
| Map API values to database fields only in backend code | Keeps query construction safe and makes supported sort behavior explicit. |
| Default missing/invalid ordering to post time | Existing links and searches should continue returning newest jobs first. |
| Include targeted tests before full pre-checkin | The repo expects `npm run pre-checkin` before commits, but narrower tests are faster while developing. |

## Implementation Findings

- Phase 1 added `JobOrderBy` backend enum values: `post_time`, `highest_salary`, and `lowest_experience`.
- Backend `useFilters` accepts `orderBy` case-insensitively and strips invalid values through the existing `soft(lower(...))` validation pattern.
- Frontend `apiEnums` now exposes `JobOrderBy`, `jobOrderByOptions`, `toJobOrderBy`, and `toJobOrderByLabel`.
- Frontend `FilterModelApi` includes `orderBy?: JobOrderBy`, but `FilterModel` parsing/serialization is intentionally left for Phase 3.

## Resources

- `packages/backend/src/controllers/job.ts`
- `packages/backend/src/middleware/inputValidators.ts`
- `packages/backend/src/models/clientModels.ts`
- `packages/frontend/src/api/filterModel.ts`
- `packages/frontend/src/api/apiTypes.ts`
- `packages/frontend/src/api/apiEnums.ts`
- `packages/frontend/src/jobs/filters/filters.ts`
- `packages/backend/test/middleware/inputValidators.test.ts`
- `packages/frontend/src/api/filterModel.test.ts`
- `packages/frontend/src/jobs/filters/filters.test.ts`
