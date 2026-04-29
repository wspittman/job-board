# Plan: Rich Metadata Aggregation & Display

## Goal

Capture and display a richer set of job market statistics on the home page stats component.
Currently, `Metadata` holds only raw counts (`jobCount`, `companyCount`). The goal is to
aggregate meaningful breakdowns from job/company fields and surface them on the home page.

## Current Phase

Phase 5

---

## Data Available for Aggregation

### From `Job` (per-document fields already stored in Cosmos)

| Field            | Type / Enum Values                                                           | Value to Job Seekers                                 |
| ---------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `presence`       | `onsite \| remote \| hybrid \| ""`                                           | High — remote/hybrid rates are a top filter          |
| `jobFamily`      | engineering, design, product, data, it, security, marketing, sales, cs, ops… | High — shows which disciplines dominate the board    |
| `seniorityLevel` | intern, entry, mid, senior, staff+, manager, director+                       | High — shows which levels are most in demand         |
| `postTS`         | Unix ms timestamp                                                            | High — "jobs posted this week" shows board freshness |
| `minSalary`      | number (USD or other currency)                                               | Medium — median/avg only meaningful if coverage ≥30% |
| `workTimeBasis`  | full_time, part_time, variable, per_diem                                     | Low–Medium — secondary concern for most seekers      |
| `engagementType` | employee_permanent, contractor, internship…                                  | Low–Medium — contract vs perm split can be useful    |
| `companyStage`   | (denormalized from Company) seed → public…                                   | Medium — signals startup vs established company mix  |

### From `Company`

| Field   | Type / Enum Values               | Value                                         |
| ------- | -------------------------------- | --------------------------------------------- |
| `stage` | bootstrapped → public, nonprofit | Medium — complements job-level `companyStage` |
| `size`  | 1-10, 11-50 … 10000+             | Low — less actionable for individual seekers  |

---

## Proposed Metadata Stats

Practical, high-signal stats to add. All computed at refresh time and stored, not at request time.

### Job-level stats (stored in `Metadata` where `id = "job"`)

```typescript
// Counts by presence mode
presenceCounts?: Partial<Record<Presence, number>>;

// Top job families by open-role count (all families)
jobFamilyCounts?: Partial<Record<JobFamily, number>>;

// Jobs posted in last 7 days
recentJobCount?: number;

// Jobs posted in last 24 hours
newJobCount?: number;
```

**Excluded for now:**

- `seniorityLevel`: data quality issues make the distribution misleading.
- `companyStage`: data quality issues make the distribution misleading.
- Salary stats: data sparsity makes medians misleading; add later once coverage is measured.
- `workTimeBasis` / `engagementType`: secondary signals; can be added incrementally.
- `companySize`: less actionable for visitors.

---

## Display Plan (Home Page)

Replace the current 2-card stats section with a richer layout. Proposed 4-card set:

| Card             | Value Source              | Example Display        |
| ---------------- | ------------------------- | ---------------------- |
| Available Jobs   | `jobCount` (existing)     | "1,234 Available Jobs" |
| Companies Hiring | `companyCount` (existing) | "87 Companies Hiring"  |
| Remote / Hybrid  | `presenceCounts`          | "X% Remote or Hybrid"  |
| Posted This Week | `recentJobCount`          | "NNN New This Week"    |

Optional secondary section (can be a follow-up):

- A mini bar chart or chip list of top 5 job families (engineering, sales, data…)

---

## Implementation Phases

### Phase 1 — Backend: DB aggregation queries

**File:** `packages/backend/src/db/db.ts`

Add to `JobContainer`:

```typescript
async getAggregateStats(): Promise<JobAggregateStats>
```

Use three separate Cosmos DB queries rather than a single full-scan with in-memory aggregation.
In-memory aggregation was found to be significantly more expensive in practice.

**`presence` and `jobFamily`** — one GROUP BY query each:

```sql
SELECT c.presence AS presence, COUNT(1) AS count
FROM c
WHERE IS_DEFINED(c.presence)
GROUP BY c.presence
```

**`recentJobCount` / `newJobCount`** — one range COUNT query per threshold:

```sql
SELECT VALUE COUNT(1) FROM c WHERE c.postTS >= <thresholdMs>
```

Where `<thresholdMs>` is the Unix-ms timestamp for 7 days ago / 24 hours ago respectively,
computed at call time.

Define `JobAggregateStats` in `models.ts` (fields: `presenceCounts`, `jobFamilyCounts`,
`recentJobCount`, `newJobCount`).

- [x] Rewrite `getAggregateStats()` in `JobContainer` using GROUP BY + COUNT queries
- [x] Update `JobAggregateStats` type (remove `seniorityCounts`, `companyStageCounts`)
- [x] Delete obsolete `aggregateJobStats` unit tests (tested helper no longer exists)
- **Status:** completed

### Phase 2 — Backend: Extend `Metadata` model

**File:** `packages/backend/src/models/models.ts`

Add the optional aggregation fields to `Metadata` (see above).

- [x] Add optional aggregation fields to `Metadata`
- **Status:** completed

### Phase 3 — Backend: Update `refreshInternal`

**File:** `packages/backend/src/controllers/metadata.ts`

Call `db.job.getAggregateStats()` during the refresh and write the results into the
`"job"` metadata document.

- [x] Call `getAggregateStats()` in `refreshInternal`
- [x] Write aggregated results into the `"job"` metadata document
- **Status:** completed

### Phase 4 — Backend: Expose in `ClientMetadata`

**Files:** `packages/backend/src/models/clientModels.ts`, `controllers/metadata.ts`

Add the new stats to `ClientMetadata` and map them through in `getClientMetadata()`.
Keep it as a single metadata endpoint (no new routes).

- [x] Add new stats to `ClientMetadata`
- [x] Map through in `getClientMetadata()`
- **Status:** completed

### Phase 5 — Frontend: API types and model

**Files:** `packages/frontend/src/api/apiTypes.ts`, `api/metadataModel.ts`

Mirror the new fields in `MetadataModelApi`. Add a helper in `MetadataModel` to
return the pre-processed stats needed by the UI (e.g., remote percentage).

- [ ] Mirror new fields in `MetadataModelApi`
- [ ] Add helper methods in `MetadataModel`
- **Status:** pending

### Phase 6 — Frontend: Update stats component

**Files:** `packages/frontend/src/home/stats.html`, `stats.ts`, `stats.css`

Expand from 2 stat cards to 4. Add Remote/Hybrid card and "Posted This Week" card.
Keep the design consistent with the existing card pattern.

- [ ] Expand stats section from 2 cards to 4
- [ ] Render Remote/Hybrid and "Posted This Week" stat cards
- **Status:** pending

---

## Key Questions

1. Should salary stats be included initially, or wait for better coverage?
2. Should job family / seniority breakdowns be displayed in the initial release or deferred?

## Decisions Made

| Decision                                                 | Rationale                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Separate GROUP BY queries for `presence` and `jobFamily` | In-memory full-scan approach was significantly more expensive than Cosmos-native GROUP BY queries |
| Range COUNT queries for `postTS` thresholds              | Cheaper than returning timestamps and counting in Node; Cosmos handles the filter server-side     |
| Store aggregates in existing `Metadata` documents        | `id = "job"` already holds `jobCount`; additive change, no schema migration needed                |
| Client receives pre-computed numbers                     | Distributions aggregated at refresh; no computation at request time                               |
| Display 4 high-signal stat cards initially               | Remote %, freshness count + existing counts; family/seniority deferred                            |
| Exclude `seniorityLevel` and `companyStage`              | Data quality issues make distributions misleading                                                 |
| Exclude salary stats                                     | Data sparsity makes medians misleading; revisit once coverage is measured                         |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |

---

## Files to Change

| File                                           | Change                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `packages/backend/src/models/models.ts`        | Extend `Metadata` with aggregation fields   |
| `packages/backend/src/db/db.ts`                | Add `getAggregateStats()` to `JobContainer` |
| `packages/backend/src/controllers/metadata.ts` | Call aggregation in `refreshInternal`       |
| `packages/backend/src/models/clientModels.ts`  | Extend `ClientMetadata`                     |
| `packages/frontend/src/api/apiTypes.ts`        | Extend `MetadataModelApi`                   |
| `packages/frontend/src/api/metadataModel.ts`   | Add helpers for new stats                   |
| `packages/frontend/src/home/stats.html`        | Add 2 new stat cards                        |
| `packages/frontend/src/home/stats.ts`          | Render new stats                            |
| `packages/frontend/src/home/stats.css`         | Adjust grid for 4 cards (likely no change)  |

### Tests to Update / Add

| File                                                  | What                                    |
| ----------------------------------------------------- | --------------------------------------- |
| `packages/backend/test/controllers/` (new file)       | Unit test for `refreshInternal` mapping |
| Frontend tests if coverage exists for `metadataModel` | Test new helper methods                 |

---

## Out of Scope (Future Ideas)

- Trend lines (jobs over time) — requires historical snapshots
- Salary distribution — requires richer compensation data coverage
- Per-company stats page — separate feature
- Search-filtered stats (e.g., "remote engineering jobs") — complex, separate feature
