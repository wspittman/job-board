# Findings & Decisions

## Plan Refresh Summary - 2026-05-22

The original `stats-page` plan was written against older backend assumptions. Current code has
already implemented part of Phase 2, and `dry-utils-cosmosdb@0.6.1` changes how the remaining
backend tests should be planned.

Key updates:

- Backend metadata aggregation now uses `Container.getCount()`, `Container.getCountBy()`, and
  `Container.query()` rather than a manual all-jobs scan.
- `getCountBy()` supports dot-path properties such as `primaryLocation.regionCode`.
- The dry-utils mock query processor supports nested `WHERE` paths, top-level selected-property
  projections, and the `getCountBy()` query pattern, which makes aggregate-path tests possible
  without a real Cosmos DB emulator.
- The implemented backend response uses `topLocationCounts`, not `topLocations`.
- The implemented backend response puts `stageCounts` on job metadata and treats it as
  job-weighted company stage distribution.
- The frontend metadata API type is now behind the backend response and needs to be updated in
  Phase 3.
- The frontend already has enum labels in `apiEnums.ts`; a new `enumLabels.ts` utility would
  duplicate the current pattern.

## Existing Metadata Shape

Backend `ClientMetadata` currently has:

- `timestamp: number`
- `companyCount: number`
- `companyNames: [string, string][]`
- `jobCount: number`
- `recentJobCount: number`
- `presenceCounts: Partial<Record<Presence, number>>`
- `jobFamilyCounts: Partial<Record<JobFamily, number>>`
- `workTimeCounts: Partial<Record<WorkTimeBasis, number>>`
- `stageCounts: Partial<Record<CompanyStage, number>>`
- `topLocationCounts: Partial<Record<UsState, number>>`
- `salaryStats: SalaryStat[]`

Frontend `MetadataModelApi` currently only includes the older subset:

- `timestamp`
- `companyCount`
- `companyNames`
- `jobCount`
- `recentJobCount`
- `presenceCounts`
- `jobFamilyCounts`

Decision: Phase 3 starts by updating `packages/frontend/src/api/apiTypes.ts`.

## Backend Aggregation

`aggregateMetadata()` in `packages/backend/src/db/db.ts` currently computes:

- total job count with `this.getCount()`
- recent job count with `this.getCount(["postTS", ">=", weekMs])`
- presence counts with `this.getCountBy("presence")`
- job family counts with `this.getCountBy("jobFamily")`
- work time counts with `this.getCountBy("workTimeBasis")`
- stage counts with `this.getCountBy("companyStage")`
- location counts with `this.getCountBy("primaryLocation.regionCode")`
- salary rows with a parameterized salary-cadence query

The helper `toCountRecord()` validates bucket names against the matching Zod enum before emitting
them.

## dry-utils-cosmosdb Current Capabilities

Installed version: `dry-utils-cosmosdb@0.6.1`.

Relevant APIs:

- `Container.getCount(condition?, partitionKey?)`
- `Container.getCountBy(prop)`
- `Container.query(query, options?)`
- `connectDB({ mockDBData, mockDBFilters, mockDBProjects })`
- `loadMockDBData({ mockDataJson, mockDataPath })`

Important mock behavior:

- Built-in mocks support the `getCountBy()` query shape:
  `SELECT c.{prop} AS name, COUNT(1) AS count FROM c WHERE IS_DEFINED(c.{prop}) GROUP BY c.{prop}`.
- Nested field lookup works for dot paths.
- Built-in filters support `IS_DEFINED`, comparison operators, `IN`, and `CONTAINS`.
- Custom `mockDBFilters` and `mockDBProjects` remain available if a future query shape is not
  supported.

Decision: Backend aggregate tests should prefer real dry-utils mock data and built-in query
support before adding custom query matchers.

## Salary Data

`Job.salaryRange` has `{ currency, cadence, min, max }`.

Current salary behavior:

- Query selects rows where `salaryRange.cadence = "salary"`.
- `computeSalaryStats()` also ignores rows where cadence is not `"salary"`.
- It uses midpoint when both min and max exist.
- It uses the single positive endpoint when only min or max exists.
- It emits one overall bucket plus one bucket per valid job family.
- Buckets with fewer than 10 salary rows are omitted.
- Invalid job family buckets are dropped, while the overall bucket can still be emitted.

Decision: Keep salary stats as annual USD-only values. Non-USD jobs are skipped before upsert in
`sync/jobs.ts`.

## Location Data

`Job.primaryLocation` remains structured source data. `ClientJob.location` is only a display string.

Current implementation groups `primaryLocation.regionCode` and validates keys with `UsState`.
Non-US jobs are skipped before `db.job.upsert()` in `sync/jobs.ts`, so location aggregation does
not need a separate country-code filter unless that ingestion rule changes.

Decision: Frontend helpers should consume `topLocationCounts` and sort entries by count. Do not
expect a `topLocations` array.

## Company Stage Data

`companyStage` is denormalized onto `Job` during refresh. Current aggregation groups jobs by
`Job.companyStage`, which answers: "How many listed jobs are at companies in each stage?"

That is different from: "How many companies are in each stage?"

Decision: The stats page should label this carefully as job-weighted company stage distribution.
A company-weighted version would require a backend change to aggregate companies instead.

## Frontend Page Pattern

The current MPA pattern is:

- root-level page file, for example `src/index.html`
- include `./partials/head.html`
- include `./partials/header.html`
- include page markup or a page component
- load a page entry script

`vite.config.ts` auto-discovers root-level `src/*.html` entries and blog HTML entries.

Decision: Create `packages/frontend/src/stats.html` as the root page and put component files under
`packages/frontend/src/stats/`.

## Frontend Enum Labels

`packages/frontend/src/api/apiEnums.ts` already defines label and option helpers for:

- work time basis
- job family
- company stage
- pay cadence
- US states

Current gaps for the stats page:

- no presence label helper
- `workTimeBasis` only includes `full_time` and `part_time`, while the backend enum also includes
  `variable` and `per_diem`

Decision: Extend `apiEnums.ts`; do not add `enumLabels.ts`.

Correction from Phase 3 review: frontend enum maps should not include empty-string values for stats
metadata. Empty properties are stripped before database insert, and `getCountBy()` only returns
defined properties.

## Component Architecture

The existing home stats component fetches formatted summary strings from `metadataModel`.
For the dedicated stats page, `metadataModel` should expose typed series data so charts do not
duplicate metadata parsing.

Decision: Keep `getCountStrings()` for the home page and add separate stats-oriented helpers.

Phase 3 added `MetadataSeries` helpers that return `{ label, count, pct }` entries. Percentages
are numeric values from 0 to 100 so later chart components can choose their own formatting.
Unknown or unlabeled buckets are filtered out.

## Technical Constraints

- No new npm dependencies.
- Use SVG/CSS for charts.
- Use `ComponentBase` and current Shadow DOM conventions.
- Keep visible chart values in text, not color-only.
- Use existing TanStack Query metadata caching through `api.fetchMetadata()`.
- Run `npm run pre-checkin` before committing code.

## Resources

- `packages/backend/src/db/db.ts`
- `packages/backend/src/controllers/metadata.ts`
- `packages/backend/src/models/models.ts`
- `packages/backend/src/models/clientModels.ts`
- `packages/backend/src/sync/jobs.ts`
- `packages/frontend/src/api/apiTypes.ts`
- `packages/frontend/src/api/apiEnums.ts`
- `packages/frontend/src/api/metadataModel.ts`
- `packages/frontend/src/home/stats.ts`
- `packages/frontend/src/components/componentBase.ts`
- `node_modules/dry-utils-cosmosdb/README.md`
- `node_modules/dry-utils-cosmosdb/dist/container.d.ts`
- `node_modules/dry-utils-cosmosdb/dist/mockQueryProcessor.js`
