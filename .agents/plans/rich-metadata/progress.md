# Progress Log

## Session: 2026-04-28

### Phase 1: Backend — DB aggregation queries

- **Status:** needs_revision — in-memory aggregation approach was significantly more expensive than Cosmos-native GROUP BY queries; new approach uses separate GROUP BY queries for `presence`/`jobFamily` and range COUNT queries for `postTS` thresholds; `seniorityLevel` and `companyStage` dropped due to data quality issues
- **Actions taken:**
  - ~~Added `JobAggregateStats` interface to `models.ts`~~ (needs to be revised: remove `seniorityCounts`, `companyStageCounts`)
  - ~~Added `aggregateJobStats()` exported helper to `db.ts`~~ (needs to be replaced with GROUP BY / range COUNT query approach)
  - ~~Added `getAggregateStats()` method to `JobContainer`~~ (needs to be rewritten)
  - ~~Wrote unit tests in `test/db/aggregateJobStats.test.ts`~~ (needs to be updated to match new shape)
- **Files created/modified:**
  - `packages/backend/src/models/models.ts`
  - `packages/backend/src/db/db.ts`
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
