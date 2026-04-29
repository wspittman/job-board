# Findings & Decisions

## Requirements

- Capture richer job market stats on the home page stats component
- Aggregate data from existing `Job` fields already stored in Cosmos (no new data collection needed)
- Stats must be pre-computed at refresh time and stored, not computed at request time
- Expand the 2-card home page stats section to 4 cards

## Research Findings

### High-signal fields available on `Job`

| Field            | Enum Values                                                       | Priority                 |
| ---------------- | ----------------------------------------------------------------- | ------------------------ |
| `presence`       | `onsite \| remote \| hybrid \| ""`                                | High                     |
| `jobFamily`      | engineering, design, product, data, it, security, marketing, etc. | High                     |
| `postTS`         | Unix ms timestamp                                                 | High                     |
| `seniorityLevel` | intern, entry, mid, senior, staff+, manager, director+            | Excluded — data quality  |
| `companyStage`   | denormalized from Company: seed → public…                         | Excluded — data quality  |
| `minSalary`      | number (USD or other currency)                                    | Excluded — data sparsity |

### CosmosDB constraints and query strategy

- Cosmos DB GROUP BY queries work per-partition-key and are cost-efficient for field distributions.
- A single full-scan query fetching all fields for in-memory aggregation was found to be
  significantly more expensive in practice than separate GROUP BY queries.
- `presence` and `jobFamily` use individual GROUP BY queries:
  `SELECT c.presence AS presence, COUNT(1) AS count FROM c WHERE IS_DEFINED(c.presence) GROUP BY c.presence`
- `recentJobCount` / `newJobCount` use range COUNT queries:
  `SELECT VALUE COUNT(1) FROM c WHERE c.postTS >= <thresholdMs>`

### Deferred fields

- `seniorityLevel`: data quality issues make the distribution misleading; excluded.
- `companyStage`: data quality issues make the distribution misleading; excluded.
- `minSalary` / salary stats: data sparsity makes medians misleading; revisit once coverage ≥ 30%.
- `workTimeBasis` / `engagementType`: secondary signals; can be added incrementally.
- `companySize`: less actionable for visitors.

## Technical Decisions

| Decision                                                 | Rationale                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Separate GROUP BY queries for `presence` and `jobFamily` | In-memory full-scan was significantly more expensive; Cosmos GROUP BY is cost-efficient |
| Range COUNT queries for `postTS` thresholds              | Server-side filtering is cheaper than returning timestamps and counting in Node         |
| Store in existing `Metadata` documents                   | No new containers or schema migrations; additive change                                 |
| Exclude `seniorityLevel` and `companyStage`              | Data quality issues make distributions misleading                                       |
| Pre-computed at refresh, served as-is                    | No per-request computation cost                                                         |
| 4 stat cards initially                                   | Remote %, freshness count + existing job/company counts — highest signal                |

## Resources

- Existing `Metadata` model: `packages/backend/src/models/models.ts`
- Refresh logic: `packages/backend/src/controllers/metadata.ts`
- DB layer: `packages/backend/src/db/db.ts`
- Frontend stats component: `packages/frontend/src/home/stats.html`, `stats.ts`, `stats.css`
- Frontend API types: `packages/frontend/src/api/apiTypes.ts`, `metadataModel.ts`
