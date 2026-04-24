## Plan: CLI Package Test Coverage

**TL;DR:** 20 source files have no tests. The existing `test/setup.ts` already provides all needed infrastructure (fetch mock, file tracker, env management) — no new dependencies required. Work splits into 4 phases by difficulty, with Phase 5 optional.

---

### Already tested (7 files — skip)

`step.ts`, `cost.ts`, `html.ts`, `fileUtils.ts`, `http.ts`, `mathUtils.ts`, `telemetryCatcher.ts`

### Deliberately excluded

- `config.ts` — trivial env var loading
- `types.ts`, `evalTypes.ts`, `pTypes.ts` — type-only, no runtime logic
- `playground.ts` — experimental one-off tool
- `e2e/flows.ts` — static data config
- `e2e/commands.ts`, `eval/eval.ts` — top-level orchestrators, high complexity, low ROI

---

### Phase 1 — Pure logic (no mocking)

| New test file                    | Source file            | Key behaviors                                                                                                                                              |
| -------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/utils/utils.test.ts`       | `utils/utils.ts`       | `validateCompanyArgs` + `validateJobArgs` — valid IDs, CSV parsing, bad ATS, missing IDs                                                                   |
| `test/eval/judge/stats.test.ts`  | `eval/judge/stats.ts`  | `checksToStats`, `combineStats` — precision/recall/F1 math                                                                                                 |
| `test/eval/judge/checks.test.ts` | `eval/judge/checks.ts` | `equals`, `equalsCasePreferred` (scoring), `equalsUrl` (4 score tiers), `arrayExactMatcher`, `runChecks` with nested rubric. Defer `similar()` to Phase 2. |

### Phase 2 — Eval judge pipeline (`mock.method` on singleton)

| New test file             | Source file            | Key behaviors                                                                                                                            |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Extend `checks.test.ts`   | `eval/judge/checks.ts` | `similar()` — mock `embedCache.getEmbeddings()` with `mock.method()` inline; high similarity, low similarity, empty embeddings (score 0) |
| `test/eval/judge.test.ts` | `eval/judge.ts`        | `judge()`, `aggregate()` — can use real check functions for non-similar cases                                                            |

### Phase 3 — Eval file I/O (real fs + cleanup)

| New test file                 | Source file         | Key behaviors                                                                          |
| ----------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `test/eval/evalFiles.test.ts` | `eval/evalFiles.ts` | `readSources`, `writeOutcome`, `writeReport` — mirror pattern from `fileUtils.test.ts` |

### Phase 4 — Portal integration (mockFetch)

| New test file                   | Source file           | Key behaviors                                                                                            |
| ------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| `test/portal/pFuncs.test.ts`    | `portal/pFuncs.ts`    | `validateLLMAction` (pure); `fetchCompany`, `fetchJob`, `fetchJobCount` via `mockFetch`                  |
| `test/index.test.ts`            | `index.ts`            | `runCommand()` routing, nested commands, unknown command prints usage, `CommandError` handled gracefully |
| `test/utils/embedCache.test.ts` | `utils/embedCache.ts` | Cache miss → calls fetch; cache hit → no fetch; `saveCache()` writes file                                |

### Phase 5 — Command implementations (optional)

- `test/api/commands.test.ts` → all 8 subcommands via `mockFetch`
- `test/ats/commands.test.ts` → counts/company/job/exactJob
- `test/eval/evaluate.test.ts` → `evaluate()`, `report()` with mocked inference

---

### Mock prerequisites

**No new infrastructure is needed.** All existing setup covers the work:

- `mockFetch()` / `afterReset()` from `test/setup.ts` → Phases 4–5
- `makeFileTracker()` / `makeDirTracker()` → Phase 3 and embedCache
- `mock.method(embedCache, 'getEmbeddings', ...)` inline in the test file → Phase 2 `similar()`

### Verification

1. After each phase: `npm run test-details --workspace=packages/cli`
2. After all phases: `npm run pre-checkin`
