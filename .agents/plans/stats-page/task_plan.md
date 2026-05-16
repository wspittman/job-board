# Task Plan: Dedicated /stats Page

## Goal

Build a dedicated `/stats` page that fetches pre-aggregated metadata and displays job market
insights in engaging formats — stat cards, bar charts, donut charts, tables, and optional
interactivity — without running any ad-hoc database queries.

## Current Phase

Phase 1 — complete

## Phases

### Phase 1: Research & Discovery

- [x] Understand current `ClientMetadata` shape and `metadataModel.ts`
- [x] Audit the backend aggregation pipeline (`sync/jobs.ts`, `db.ts`)
- [x] Map all Job/Company fields available for aggregation
- [x] Understand MPA page pattern and ComponentBase system
- [x] Confirm no chart library is currently in use
- **Status:** complete

---

### Phase 2: Backend — Extend Metadata Aggregation

**Goal:** Add richer pre-aggregated buckets to the metadata documents stored in CosmosDB.

Only fields that appear in `Filters` or `ClientJob` are considered reliable enough to aggregate.
Fields like `SeniorityLevel`, `EngagementType`, and `CompanySizeBand` are excluded — they are not
exposed in `Filters` or returned in `ClientJob`. Currency segmentation is dropped because the site
is US-only (always USD). `primaryLocation` is reliable but compresses to a string in `ClientJob`
for legacy reasons; aggregation uses the structured source data, clamped to US (ignore any
non-US records).

New fields to add to the `"job"` metadata document:

| Field            | Type                                                                                   | Description                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `workTimeCounts` | `Partial<Record<WorkTimeBasis, number>>`                                               | Full-time vs part-time etc. (`workTimeBasis` filter)                                        |
| `topLocations`   | `{ regionCode: string; count: number }[]`                                              | Top 10 US states by job count (clamped to US; countryCode ignored)                          |
| `salaryStats`    | `{ jobFamily?: JobFamily; median: number; p25: number; p75: number; count: number }[]` | Annual salary percentiles overall + per job family (min 10 samples per bucket; USD implied) |

New fields to add to the `"company"` metadata document:

| Field         | Type                                    | Description                                         |
| ------------- | --------------------------------------- | --------------------------------------------------- |
| `stageCounts` | `Partial<Record<CompanyStage, number>>` | Companies per funding stage (`companyStage` filter) |

Files to modify:

- `packages/backend/src/models/models.ts` — extend `Metadata` interface
- `packages/backend/src/models/clientModels.ts` — extend `ClientMetadata`
- `packages/backend/src/db/db.ts` — extend `aggregateMetadata()` to compute new fields
- `packages/backend/src/controllers/metadata.ts` — ensure new fields flow through to response

- **Status:** pending

---

### Phase 3: Frontend — metadataModel Helpers

**Goal:** Add typed helper methods to `metadataModel.ts` for the new data, with presentable
labels and sorted output.

New methods (restricted to trusted fields — those in `Filters` or `ClientJob`):

- `getJobFamilySeries()` — all families as `{ label, count, pct }[]` sorted by count
- `getPresenceSeries()` — onsite/remote/hybrid as `{ label, count, pct }[]`
- `getWorkTimeSeries()` — returns `{ label, count, pct }[]`
- `getCompanyStageSeries()` — returns `{ label, count, pct }[]` sorted by funding stage progression
- `getTopLocations()` — returns `{ label, count, pct }[]` (label = full state name from regionCode)
- `getSalaryStats()` — returns the salary stats array from metadata

Human-readable label maps for all enum values should live in a new
`packages/frontend/src/utils/enumLabels.ts` utility.

Files to create/modify:

- `packages/frontend/src/utils/enumLabels.ts` — label maps for all enums
- `packages/frontend/src/api/metadataModel.ts` — add new helper methods

- **Status:** pending

---

### Phase 4: Frontend — Stats Page HTML & Entry Point

**Goal:** Create the stats page shell following the MPA pattern.

Files to create:

- `packages/frontend/src/stats.html` — page shell with partial includes, nav, `<stats-page>` element
- `packages/frontend/src/stats/stats.ts` — page entry point, registers components
- `packages/frontend/src/stats/stats.css` — page-level styles

The page is divided into named sections:

1. **Hero / summary row** — big numbers (jobs, companies, remote %, last updated)
2. **Job Families** — horizontal bar chart (all families, sorted by count)
3. **Work Arrangement** — donut/pie chart (remote / hybrid / onsite)
4. **Work Type** — small bar chart (full-time / part-time / contractor etc.)
5. **Company Stage** — horizontal bar chart (funding stage distribution)
6. **Top Locations** — ranked bar chart of top 10 US states by job count
7. **Salary Insights** — table of overall + per-family median/p25/p75 in USD (shown only when ≥10 samples)

Sections removed vs. original plan: Seniority Breakdown (`SeniorityLevel` not in `Filters`/`ClientJob`),
Company Size (`CompanySizeBand` not in `Filters`/`ClientJob`). Currency column dropped from Salary
Insights (US-only). Top Locations restored — `primaryLocation` is reliable source data; the
string compression in `ClientJob` is a legacy display concern only.

- **Status:** pending

---

### Phase 5: Frontend — Chart Web Components

**Goal:** Build reusable chart components using SVG (no new dependencies).

Components to create in `packages/frontend/src/stats/`:

| Component tag       | File                        | Description                                                     |
| ------------------- | --------------------------- | --------------------------------------------------------------- |
| `stats-bar-chart`   | `bar-chart.ts/.html/.css`   | Horizontal bar chart; accepts `{ label, value, pct }[]` + color |
| `stats-donut-chart` | `donut-chart.ts/.html/.css` | SVG donut/pie; accepts `{ label, value, color }[]`              |
| `stats-data-table`  | `data-table.ts/.html/.css`  | Accessible `<table>` with sortable columns                      |
| `stats-hero`        | `hero.ts/.html/.css`        | The large stat card row at the top                              |
| `stats-section`     | `section.ts/.html/.css`     | Titled card section wrapper                                     |

Design notes:

- All SVG charts must use CSS custom properties for colors so they theme correctly
- Charts should include `<title>` and ARIA labels for accessibility
- Bar chart fill width driven by CSS `--pct` custom property (no JS layout calculations)
- Donut chart uses `stroke-dasharray` technique for SVG circles

- **Status:** pending

---

### Phase 6: Interactivity

**Goal:** Add useful interactive behaviour without over-engineering.

Interactions to implement:

- **Tooltip on bar/donut hover** — show exact count + percentage in a floating label
- **Sort toggle on data table** — click column header to sort asc/desc
- **"Show all / show top 5" toggle** on job families bar chart (it can be long)

No client-side cross-filter between charts (out of scope for v1).

- **Status:** pending

---

### Phase 7: Tests & Pre-Checkin

**Goal:** Validate new code, run pre-checkin.

- [ ] Unit tests for new `metadataModel` helper methods
- [ ] Unit tests for `aggregateMetadata()` additions in db.ts
- [ ] `npm run pre-checkin` passes clean

Files to create:

- `packages/backend/test/db/aggregateMetadata.test.ts` (new or extend existing)
- `packages/frontend/test/` stats model helpers test

- **Status:** pending

---

## Key Decisions

| Decision                                                   | Rationale                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No new chart library                                       | Project policy avoids new dependencies; SVG charts are sufficient and keep bundle lean          |
| Aggregate new fields in backend sync                       | Metadata is already pre-aggregated post-sync; extending it costs nothing at query time          |
| Only aggregate fields present in `Filters` or `ClientJob`  | Other fields are not reliable enough per product decision                                       |
| Drop `SeniorityLevel`, `EngagementType`, `CompanySizeBand` | Not in `Filters` or `ClientJob` — data accuracy not guaranteed                                  |
| `topLocations` aggregates by US state (`regionCode`)       | `primaryLocation` is reliable; string form in `ClientJob` is legacy display only; clamped to US |
| No currency segmentation on salary                         | Site is US-only; currency is always USD — segmentation adds no value                            |
| Salary stats only when ≥10 data points per bucket          | Sparse salary data would be misleading                                                          |
| Salary percentiles (p25/median/p75) by job family          | IQR is robust for skewed distributions; job family is a trusted, filterable dimension           |
| Enum label maps in `enumLabels.ts`                         | Single source of truth for human-readable labels, reusable across site                          |

## Key Questions (answered)

1. ~~Is there a chart library already?~~ No — use SVG.
2. ~~What metadata fields exist today?~~ See Phase 2 table.
3. ~~How do pages get registered in vite?~~ Auto-discovered — just create `stats.html` in `src/`.
4. ~~Does salary data exist in the model?~~ Yes — `salaryRange.{min,max,currency,cadence}` on `Job`.
5. ~~Is structured location data reliable?~~ No — `location` in `ClientJob` is a plain string; dropped.

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| —     | —       | —          |
