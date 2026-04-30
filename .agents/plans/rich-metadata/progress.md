# Progress Log

## Session: 2026-04-28

### Phase 1: Backend — DB aggregation queries

- **Status:** completed
- **Actions taken:**
  - Updated `JobAggregateStats` in `models.ts`: removed `seniorityCounts` and `companyStageCounts`; removed unused `CompanyStage`/`SeniorityLevel` imports
  - Replaced `getAggregateStats()` in `db.ts`: now uses 4 parallel Cosmos DB queries — GROUP BY for `presence` and `jobFamily`, range COUNT for 7-day and 24-hour postTS thresholds
  - Removed `aggregateJobStats` in-memory helper entirely (it was the old approach)
  - Deleted `test/db/aggregateJobStats.test.ts` (the tested function no longer exists; new query-based logic has no isolated pure function to unit test)
- **Files modified:**
  - `packages/backend/src/models/models.ts`
  - `packages/backend/src/db/db.ts`
- **Files deleted:**
  - `packages/backend/test/db/aggregateJobStats.test.ts`

### Phase 2: Backend — Extend `Metadata` model

- **Status:** completed
- **Actions taken:**
  - Added optional `presenceCounts`, `jobFamilyCounts`, `recentJobCount`, `newJobCount` fields to `Metadata` interface
- **Files modified:**
  - `packages/backend/src/models/models.ts`

### Phase 3: Backend — Update `refreshInternal`

- **Status:** completed
- **Actions taken:**
  - Added `db.job.getAggregateStats()` to the `Promise.all` in `refreshInternal`
  - Spread `aggregateStats` into the `"job"` metadata upsert
- **Files modified:**
  - `packages/backend/src/controllers/metadata.ts`

### Phase 4: Backend — Expose in `ClientMetadata`

- **Status:** completed
- **Actions taken:**
  - Added `Presence` to imports in `clientModels.ts`
  - Added `presenceCounts`, `jobFamilyCounts`, `recentJobCount`, `newJobCount` to `ClientMetadata`
  - Mapped new fields from `jobMetadata` in `getClientMetadata()`
- **Files modified:**
  - `packages/backend/src/models/clientModels.ts`
  - `packages/backend/src/controllers/metadata.ts`

### Phase 5: Frontend — API types and model

- **Status:** completed
- **Actions taken:**
  - Added `Presence` type (`"onsite" | "remote" | "hybrid" | ""`) to `apiEnums.ts`
  - Added `Presence` import and new fields (`presenceCounts`, `jobFamilyCounts`, `recentJobCount`, `newJobCount`) to `MetadataModelApi` in `apiTypes.ts`
  - Added `getRichStats()` helper to `MetadataModel` in `metadataModel.ts`; computes remote/hybrid percentage and surfaces `recentJobCount` for the stats cards
- **Files modified:**
  - `packages/frontend/src/api/apiEnums.ts`
  - `packages/frontend/src/api/apiTypes.ts`
  - `packages/frontend/src/api/metadataModel.ts`

### Phase 6: Frontend — Update stats component

- **Status:** completed
- **Actions taken:**
  - Added `remoteHybridPct` to `getCountStrings()` in `metadataModel.ts` (computed from raw `presenceCounts` before stringifying; no separate `getRichStats()` needed)
  - Added "Remote or Hybrid" and "Posted This Week" stat cards to `stats.html`
  - Updated `stats.ts` to destructure all 4 values from `getCountStrings()` and set all 4 stat texts
- **Files created/modified:**
  - `packages/frontend/src/api/metadataModel.ts`
  - `packages/frontend/src/home/stats.html`
  - `packages/frontend/src/home/stats.ts`

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
