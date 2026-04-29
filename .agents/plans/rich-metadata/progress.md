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

- **Status:** pending
- **Actions taken:**
- **Files created/modified:**

### Phase 3: Backend — Update `refreshInternal`

- **Status:** pending
- **Actions taken:**
- **Files created/modified:**

### Phase 4: Backend — Expose in `ClientMetadata`

- **Status:** pending
- **Actions taken:**
- **Files created/modified:**

### Phase 5: Frontend — API types and model

- **Status:** pending
- **Actions taken:**
- **Files created/modified:**

### Phase 6: Frontend — Update stats component

- **Status:** pending
- **Actions taken:**
- **Files created/modified:**

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
