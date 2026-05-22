# Task Plan: Dedicated /stats Page

## Goal

Build a dedicated `/stats` page that displays pre-aggregated job market insights from metadata:
stat cards, bar charts, donut charts, tables, and light interactivity. The page must not run
ad-hoc database queries from the request path.

## Current Phase

Phase 3 - pending. The plan was refreshed on 2026-05-22 for the current codebase and
`dry-utils-cosmosdb@0.6.1`.

## Phases

### Phase 1: Research & Discovery

- [x] Understand current `ClientMetadata` shape and metadata flow
- [x] Audit backend aggregation pipeline (`sync/jobs.ts`, `db.ts`, `metadata.ts`)
- [x] Map trusted Job/Company fields available for aggregation
- [x] Understand MPA page pattern and `ComponentBase` system
- [x] Confirm no chart library is currently in use
- **Status:** complete

---

### Phase 2: Backend - Metadata Aggregation

**Goal:** Use backend sync-time aggregation to store richer metadata in Cosmos DB.

This phase is already implemented in code. The current implementation uses
`dry-utils-cosmosdb@0.6.1` helpers instead of a manual full-scan loop:

- `Container.getCount()`
- `Container.getCount(condition)`
- `Container.getCountBy(prop)`
- `Container.query()` for the salary projection

`getCountBy()` now supports dot-path notation, and the mock query processor supports the nested
filtering and projection patterns currently used by these aggregate queries.

Current `"job"` metadata fields:

| Field               | Type                                                                                   | Description                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `jobCount`          | `number`                                                                               | Total active jobs                                                                                   |
| `recentJobCount`    | `number`                                                                               | Jobs with `postTS` in the last 7 days                                                               |
| `presenceCounts`    | `Partial<Record<Presence, number>>`                                                    | Onsite/remote/hybrid counts                                                                         |
| `jobFamilyCounts`   | `Partial<Record<JobFamily, number>>`                                                   | Job family counts                                                                                   |
| `workTimeCounts`    | `Partial<Record<WorkTimeBasis, number>>`                                               | Full-time, part-time, variable, per-diem counts                                                     |
| `stageCounts`       | `Partial<Record<CompanyStage, number>>`                                                | Job-weighted company stage counts from denormalized `Job.companyStage`                              |
| `topLocationCounts` | `Partial<Record<UsState, number>>`                                                     | Top 10 state/territory buckets by count from `primaryLocation.regionCode`                           |
| `salaryStats`       | `{ jobFamily?: JobFamily; median: number; p25: number; p75: number; count: number }[]` | Annual salary percentiles overall and per job family, with buckets emitted only at 10+ salary rows |

Current `"company"` metadata fields remain:

| Field             | Type                | Description                                     |
| ----------------- | ------------------- | ----------------------------------------------- |
| `companyCount`    | `number`            | Companies that currently have jobs              |
| `companyQuickRef` | `CompanyQuickRef[]` | Quick refs for companies that currently have jobs |

Important corrections from the original plan:

- `stageCounts` is currently job-weighted and belongs to the `"job"` metadata document.
- There is no implemented company-level `stageCounts` bucket.
- `topLocations` is not an array; the implemented API shape is `topLocationCounts`.
- Location aggregation relies on sync-time filtering: non-US jobs are skipped before upsert in
  `sync/jobs.ts`.
- Salary aggregation already ignores non-annual cadence rows in both the SQL filter and
  `computeSalaryStats()`.

Files already modified:

- `packages/backend/src/models/models.ts`
- `packages/backend/src/models/clientModels.ts`
- `packages/backend/src/db/db.ts`
- `packages/backend/src/controllers/metadata.ts`
- `packages/backend/test/db/aggregateMetadata.test.ts`

Remaining backend validation for Phase 7:

- Add or extend tests that exercise `aggregateMetadata()` itself against the dry-utils mock DB.
- Cover `getCountBy("primaryLocation.regionCode")`, `getCountBy("companyStage")`, and salary
  projection behavior through the current dry-utils mock support.

- **Status:** complete for implementation; broader aggregation-path tests pending in Phase 7

---

### Phase 3: Frontend - Metadata Types and Helpers

**Goal:** Bring the frontend metadata API type and helper methods up to date with the backend
metadata response.

Files to modify:

- `packages/frontend/src/api/apiTypes.ts`
- `packages/frontend/src/api/apiEnums.ts`
- `packages/frontend/src/api/metadataModel.ts`
- `packages/frontend/src/api/metadataModel.test.ts`
- `packages/frontend/src/utils/testUtils.ts`

Required updates:

- Extend `MetadataModelApi` with:
  - `workTimeCounts`
  - `stageCounts`
  - `topLocationCounts`
  - `salaryStats`
- Add a frontend `SalaryStat` type matching the backend response shape.
- Keep label logic in `apiEnums.ts`; do not create a new `enumLabels.ts`.
- Add `toPresenceLabel()` or equivalent, since stats needs display labels for presence values.
- Expand `workTimeBasis` labels to include `variable` and `per_diem`, matching the backend enum.
- Treat empty or unknown metadata buckets deliberately in helper methods, usually as
  `"Unspecified"` or by filtering them out depending on the chart.

New `metadataModel` helper methods:

- `getJobFamilySeries()` - all job families as `{ label, count, pct }[]`, sorted by count
- `getPresenceSeries()` - onsite/remote/hybrid as `{ label, count, pct }[]`
- `getWorkTimeSeries()` - work time basis as `{ label, count, pct }[]`
- `getCompanyStageSeries()` - job-weighted company stage series sorted by funding progression
- `getTopLocations()` - state/territory series from `topLocationCounts`, sorted by count
- `getSalaryStats()` - salary stats array from metadata

Implementation notes:

- Use raw counts plus a numeric `pct` value for chart data; components can decide how to format.
- Keep `getCountStrings()` intact for the existing home page.
- Prefer shared internal helpers for count-record to series conversion and percentage math.

- **Status:** pending

---

### Phase 4: Frontend - Stats Page Shell

**Goal:** Create the `/stats` MPA page following the current Vite/root HTML pattern.

Files to create or modify:

- `packages/frontend/src/stats.html`
- `packages/frontend/src/stats/stats.ts`
- `packages/frontend/src/stats/stats.html`
- `packages/frontend/src/stats/stats.css`
- `packages/frontend/src/partials/header.html`

Current page pattern:

- Root-level HTML files under `packages/frontend/src` are auto-discovered by `vite.config.ts`.
- Page entries import `../sharedStyles/all.css` plus page-local CSS.
- The root HTML should include `./partials/head.html`, `./partials/header.html`, the stats page
  markup/component, and a module script.

The page should include:

1. Hero/summary row - jobs, companies, remote percentage, last updated
2. Job families - horizontal bar chart
3. Work arrangement - donut chart for remote/hybrid/onsite
4. Work type - bar chart for full-time/part-time/variable/per-diem
5. Company stage - job-weighted company stage distribution
6. Top locations - ranked top 10 states/territories
7. Salary insights - overall and per-family p25/median/p75 table

Removed from the original plan:

- Seniority breakdown
- Engagement type breakdown
- Company size breakdown
- Currency segmentation

- **Status:** pending

---

### Phase 5: Frontend - Chart Components

**Goal:** Build reusable, dependency-free chart components using HTML/CSS/SVG.

Components to create in `packages/frontend/src/stats/`:

| Component tag       | File                        | Description                                                     |
| ------------------- | --------------------------- | --------------------------------------------------------------- |
| `stats-bar-chart`   | `bar-chart.ts/.html/.css`   | Horizontal bar chart for `{ label, count, pct }[]`              |
| `stats-donut-chart` | `donut-chart.ts/.html/.css` | SVG donut chart for presence data                               |
| `stats-data-table`  | `data-table.ts/.html/.css`  | Accessible sortable table for salary stats                      |
| `stats-hero`        | `hero.ts/.html/.css`        | Summary stat row                                                |
| `stats-section`     | `section.ts/.html/.css`     | Reusable titled section wrapper                                 |

Design notes:

- No new chart dependency.
- Use CSS custom properties for chart colors and theme compatibility.
- Include text labels and values; color must not be the only information channel.
- SVG charts need `<title>` and useful ARIA labels.
- Keep layout responsive with stable dimensions for charts, legends, buttons, and tables.

- **Status:** pending

---

### Phase 6: Interactivity

**Goal:** Add useful interaction without turning the stats page into a dashboard.

Interactions to implement:

- Tooltip or inline hover/focus label on bar and donut segments
- Sort toggle on salary table columns
- Show all / show top 5 toggle for job families

Out of scope for v1:

- Cross-filtering between charts
- Client-side ad-hoc database queries
- New dependencies

- **Status:** pending

---

### Phase 7: Tests & Pre-Checkin

**Goal:** Validate backend aggregation, frontend helpers, and UI components.

Tests to add or update:

- Backend `aggregateMetadata()` integration-style unit test using dry-utils mock data
- Backend tests for `computeSalaryStats()` and percentile helpers, keeping existing coverage
- Frontend `metadataModel` helper tests
- Frontend chart component tests for rendering empty, normal, and sorted data

Validation commands:

- `npm run test --workspace=backend`
- `npm run test --workspace=frontend`
- `npm run pre-checkin`

Per repository instructions, always run `npm run pre-checkin` before committing code.

- **Status:** pending

---

## Key Decisions

| Decision                                                   | Rationale                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| No new chart library                                       | Existing project policy avoids new dependencies; SVG and CSS are enough for v1                    |
| Use sync-time metadata                                     | Metadata is already refreshed after sync; the stats page should read existing metadata only       |
| Use dry-utils aggregation helpers                          | `dry-utils-cosmosdb@0.6.1` supports counts, count-by buckets, dot paths, and mock query behavior  |
| Keep labels in `apiEnums.ts`                               | The frontend already uses this as the enum conversion and label source                            |
| `stageCounts` is job-weighted                              | Current data is denormalized on jobs and reflects the distribution of available roles by stage    |
| `topLocationCounts` is the API shape                       | Current backend emits a record keyed by `UsState`, not an array of location objects               |
| Salary stats require 10+ samples                           | Sparse salary buckets would be misleading                                                         |
| Drop seniority, engagement type, company size, and currency | They are either not exposed to the client filters/jobs or not useful for the current US-only site |

## Key Questions

| Question                                                        | Answer                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Is there a chart library already?                               | No; use dependency-free SVG/CSS components                                                   |
| How does Vite discover pages?                                   | Root-level `src/*.html` entries are collected by `vite.config.ts`                            |
| Does dry-utils-cosmosdb support the needed aggregation helpers?  | Yes; `getCountBy()` supports dot paths and mocks support the current aggregate query patterns |
| Should `stageCounts` be company-weighted or job-weighted?        | Current code is job-weighted. A company-weighted chart would require a backend change        |
| Should a new `enumLabels.ts` be created?                        | No; use and extend `packages/frontend/src/api/apiEnums.ts`                                   |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| -     | -       | -          |
