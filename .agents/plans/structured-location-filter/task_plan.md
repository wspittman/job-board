# Task Plan: Structured City + State Location Filter

## Goal

Replace the freeform `location` string filter with separate `city` (text input) and `state` (US states/territories dropdown) filters, eliminating the LLM round-trip for state resolution while keeping LLM normalization for city names. Maintain backward compatibility for existing `/jobs` bookmarks using the old `?location=` param.

## Current Phase

Phase 5

## Phases

### Phase 1: Backend — Split `Filters` model and validation

- [x] `clientModels.ts`: replace `Filters.location?: string` with `Filters.city?: string` + `Filters.state?: string`
- [x] `inputValidators.ts`: update `FiltersSchema` to validate `city` + `state` query params; keep `location` as a deprecated passthrough for backward compat
- [x] `extractionModels.ts`: simplify `ExtractionFilters.location: ExtractionLocation` → `city?: string` + `state?: string` (drop `countryCode` since US-only; rename `regionCode` → `state` to match new naming)
- [x] Fix any TypeScript compilation errors introduced
- **Status:** complete

### Phase 2: Backend — AI layer

- [x] `interpretFilters.ts`: stop flattening structured location back to a string; return `{ city?, state? }` directly
- [x] `extractLocation.ts`: scope the LLM prompt to city-only normalization (since state is now a structured input); update return type to `string | undefined` (the normalized city name)
- [x] `location.ts`: assess whether `normalizedLocation` is still needed (still used in `toClient.ts` for job display — keep it, just no longer used in filters)
- **Status:** complete

### Phase 3: Backend — Job controller and routes

- [x] `job.ts`: remove `EnhancedFilters`/`queryLocation` indirection; LLM normalizes city only; `state` used directly
- [x] Update Cosmos DB query construction: city+state (exact), state-only (ENDSWITH), city-only (STARTSWITH); remote broadening per case
- [x] ~~`inputValidators.ts`: handle legacy `?location=` param~~ — superseded: `findings.md` confirms backward compat belongs in the frontend (Phase 4); backend never receives old `?location=` params
- **Status:** complete

### Phase 4: Frontend — UI and FilterModel

- [x] `apiTypes.ts`: replace `location?: string` in `FilterModelApi` with `city?: string` + `state?: string`
- [x] `apiEnums.ts`: add `usState` object (50 states + DC + 5 territories); export `UsState`, `stateOptions`, `toUsState`, `toUsStateLabel`
- [x] `filterModel.ts`: replace `location` with `city`/`state` in `#fromGeneric` and `toFriendlyStrings`; add backward-compat `?location=` handling in `#fromLocationSearchString` — sets `city = location` and leaves state blank (LLM normalizes on backend)
- [x] `filters.ts`: replace `location` text input with `city` text input + `state` `jb-form-select` dropdown using `stateOptions`
- [x] `filterModel.test.ts`: update 3 tests that referenced `location` to use `city`/`state`; added state chip label test (`state=WA → 'State: Washington'`)
- **Status:** complete

### Phase 5: Tests and pre-checkin

- [ ] Update unit tests affected by `Filters` model change
- [ ] Update/add tests for backward-compat location parsing heuristic
- [ ] Run `npm run pre-checkin`
- **Status:** not_started

## Key Questions

1. ~~How should legacy `?location=` values be parsed for backward compat?~~ → See findings.md: lightweight string heuristic, no LLM.
2. ~~Is `normalizedLocation()` still needed?~~ → Yes, still used in `toClient.ts` for job display strings. Not touched.
3. Does the state dropdown need US territories (PR, GU, VI, AS, MP)? → Assumed yes, based on user's "state/territory" phrasing.
4. Should `state` be validated against a known list on the backend, or accept any 2-char code? → Validate against a constants list to prevent garbage input.

## Decisions Made

| Decision                                                                           | Rationale                                                                                                                                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Rename `regionCode` → `state` in filter models                                     | Clearer naming for US-only context; `regionCode` was a generic ISO concept                                                                     |
| Keep `countryCode` only on job storage models, drop from filter inputs             | US-only board; defaulting to US is already in place in the job controller                                                                      |
| Backward compat via string heuristic (not LLM)                                     | LLM is overkill for simple "City, ST" parsing; heuristic covers the common bookmark patterns                                                   |
| City still uses LLM normalization                                                  | Typos, capitalization, metro areas still benefit from normalization                                                                            |
| `extractLocation` return type becomes `string \| undefined` (normalized city name) | State is no longer its responsibility; simplifies the function                                                                                 |
| Validate `state` against a known US states + territories list                      | Prevents garbage input; `UsState` Zod enum in `enums.ts` is the single source of truth, reused by both `FiltersSchema` and `ExtractionFilters` |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       |         |            |
