# Findings & Decisions

## Requirements

- Replace `Filters.location: string` with `Filters.city?: string` + `Filters.state?: string`
- Both fields optional; city still LLM-normalized; state is structured (2-char code)
- Miami, WA returning 0 results is correct/by-design behavior
- WA + Remote = remote jobs performable from Washington (existing behavior, not changing)
- Old `?location=...` bookmarks must continue to work (convert to new style)

## Current Architecture

### Data Flow (before change)

```
User types "Seattle" → FilterModel.location = "Seattle" → ?location=Seattle
  → backend FiltersSchema.location = "Seattle"
  → job controller: extractLocation("Seattle") → LLM → { city: "Seattle", regionCode: "WA", countryCode: "US" }
  → Cosmos DB query on locationSearchKey = "|Seattle|WA|US|"
```

### NL Search (before change)

```
User types "jobs in Seattle" → interpretFilters() → LLM extracts ExtractionLocation { city, regionCode, countryCode }
  → normalizedLocation() → "Seattle, WA, United States (US)"
  → Filters.location = "Seattle, WA, United States (US)"
  → same flow as above: re-parsed by extractLocation() LLM
```

### Key Inefficiency

The `interpretFilters` path extracts a structured `ExtractionLocation`, collapses it to a string, then the job controller re-parses it with another LLM call (`extractLocation`). The proposed change eliminates the intermediate string entirely.

### locationSearchKey Format

Jobs store `locationSearchKey = "|city|regionCode|countryCode|"` (e.g., `"|Seattle|WA|US|"`).

Cosmos DB queries:

- City: `c.locationSearchKey = CONCAT('|', @city, '|', @state, '|US|')`
- State only: `ENDSWITH(c.locationSearchKey, CONCAT('|', @state, '|US|'))`
- Remote + state: `c.isRemote = true AND ENDSWITH(...)` (existing behavior, not changing)

## File Map

| File                                                 | Change                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/src/models/clientModels.ts`        | `location?: string` → `city?: string` + `state?: string`                                                                            |
| `packages/backend/src/models/extractionModels.ts`    | `ExtractionFilters.location: ExtractionLocation` → `city?: string` + `state?: string`; simplify `ExtractionLocation` for filter use |
| `packages/backend/src/middleware/inputValidators.ts` | `FiltersSchema`: add `city` + `state` fields; keep `location` as legacy field                                                       |
| `packages/backend/src/ai/interpretFilters.ts`        | Stop calling `normalizedLocation()`; return `{ city?, state? }` directly                                                            |
| `packages/backend/src/ai/extractLocation.ts`         | Narrow scope to city-only normalization; return `string \| undefined`                                                               |
| `packages/backend/src/controllers/job.ts`            | Use `city` + `state` directly; LLM call only for city; update Cosmos DB query construction                                          |
| `packages/backend/src/utils/location.ts`             | No change (still used for job display in `toClient.ts`)                                                                             |
| `packages/frontend/src/api/filterModel.ts`           | Split `location` → `city` + `state`; backward compat for `?location=`                                                               |
| `packages/frontend/src/jobs/filters/filters.ts`      | Replace location text input with city input + state dropdown                                                                        |
| Filter chips / display (frontend)                    | Update chip labels                                                                                                                  |
| Tests                                                | Update affected tests                                                                                                               |

## US States + Territories List

50 states + DC + 5 inhabited territories:
`AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY, DC, AS, GU, MP, PR, VI`

This list lives as a constant (e.g., `US_STATES`) shared between frontend and backend validation. Likely in `packages/backend/src/utils/constants.ts` (already exists) and re-exported or duplicated in frontend.

## Backward Compatibility Heuristic

Old `?location=` values come from:

1. User typing directly: e.g., `"Seattle"`, `"Washington"`, `"Seattle, WA"`
2. NL search result: e.g., `"Seattle, WA, United States (US)"`, `"Washington (US)"`

**Heuristic (applied in frontend `FilterModel` during URL param parsing):**

```
Parse "?location=<value>":
1. Split on ", "
2. Last token: if 2 chars and matches US state code → state = token; rest = city
   If last token = "United States (US)" or "US" → discard, try again with remaining tokens
3. If single token that matches a state code (2 chars) → state = token, city = undefined
4. Otherwise → city = full value, state = undefined
```

Examples:

- `"Seattle, WA"` → city=Seattle, state=WA ✓
- `"Seattle, WA, United States (US)"` → discard "United States (US)", then city=Seattle, state=WA ✓
- `"Seattle"` → city=Seattle, state=undefined ✓
- `"WA"` → city=undefined, state=WA ✓
- `"Washington"` → city=Washington, state=undefined (not a state code; best effort) ✓

The backend does not need to handle backward compat because old bookmarks are client-side URLs — the frontend parses them and re-emits `?city=&state=` to the API.

## NL Search Integration

`interpretFilters` returns a `Filters` object. After the change, it returns `{ city?: string, state?: string }` for the location portion. The frontend receives this and populates `FilterModel.city` and `FilterModel.state` directly — no additional parsing needed.

## Technical Decisions

| Decision                                        | Rationale                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state` (not `regionCode`) in `Filters`         | Clearer for US-only context                                                                                                      |
| Heuristic in frontend, not backend              | Old `?location=` params are frontend URL state; backend never sees them directly in the new design                               |
| `extractLocation` returns `string \| undefined` | City normalization only; eliminates the structured-object → string → structured round trip                                       |
| Keep `ExtractionLocation` for job ingestion     | Job records still store `primaryLocation: ExtractionLocation` with city/regionCode/countryCode; only the _filter_ schema changes |
