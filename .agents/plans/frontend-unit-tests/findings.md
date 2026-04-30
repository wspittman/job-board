# Findings & Decisions

## Requirements

- Expand frontend test suite from 7 files (all in `src/components/`) to cover data models, remaining components, utilities, and page components.
- ~30 of 39 source files currently untested.
- All new tests must pass `npm run test --workspace=frontend` and `npm run pre-checkin`.
- No new production dependencies.

## Research Findings

### Files to Skip Permanently

| File                            | Reason                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `api.ts`                        | TanStack Query wrapper; integration-level, requires network or complex fetch mocking |
| `apiTypes.ts`                   | Type-only; nothing to assert                                                         |
| `blog.ts`                       | Imports styles only; no logic                                                        |
| `heroIcons.ts`                  | Decorative SVG component; no data or behavior logic                                  |
| `home.ts`                       | Entry point; orchestrates lazy loads via `requestIdleCallback`; no extractable logic |
| `detail-embed.ts`               | Passive rendering wrapper; no data transformation                                    |
| `testSetup.ts` / `testUtils.ts` | Test infrastructure; indirectly exercised by all tests                               |

### Test Infrastructure Notes

- JSDOM is already configured; `localStorage`/`sessionStorage` available without extra setup.
- `navigator.sendBeacon` must be stubbed before importing `storage.ts` (module-level `beacon()` call executes on import).
- Existing component tests use `testUtils.ts` helpers — follow the same patterns.
- Use `vi.spyOn` for API and model dependencies; use `vi.fn` for browser APIs (`location.assign`).

### Phase Rationale

- **Phase 1 (Data Model):** Pure TypeScript, zero DOM dependencies — highest test value per line of effort.
- **Phase 3 (Utilities):** Quick win using existing JSDOM environment.
- **Phase 2 (Components):** Same conventions as existing 7 tests — low ramp-up cost.
- **Phase 4 (Page Components):** Clear inputs/outputs but requires dependency mocking.
- **Phase 5 (Orchestrators):** Deferred; revisit only if regressions motivate it.

## Technical Decisions

| Decision                                                            | Rationale                                        |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| Use `test.for(...)` tables for normalization and enum cases         | Reduces boilerplate for parameterized assertions |
| Mock `metadataModel.getCompanyFriendlyName` via `vi.spyOn`          | Isolates model logic from metadata service       |
| Create mock `JobModel` objects directly; do not construct real ones | Avoids pulling in unrelated dependencies         |
| Stub `navigator.sendBeacon` before importing `storage.ts`           | Module-level side effect executes on import      |
| Skip `search()` in `jobModel.test.ts`                               | Uses `api.fetchJobs`; integration-level          |

## Resources

- Existing test files: `src/components/*.test.ts` — reference for conventions
- Vitest config: `vitest.config.ts`
- Test setup: `src/utils/testSetup.ts`
