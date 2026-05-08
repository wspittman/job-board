# Task Plan: Upgrade applicationinsights v2 → v3

## Goal

Upgrade the backend from `applicationinsights` v2 to v3 without regressions in
context enrichment, dev-mode suppression, or auto-instrumentation.

## Current Phase

Phase 2

## Phases

### Phase 1: Package bump + compile errors

- [x] Bump `applicationinsights` to `^3` in `packages/backend/package.json`
- [x] Run `npm install`
- [x] Replace deep internal imports in `src/utils/telemetry.ts` (see findings.md §Breaking Changes 1):
  - `CorrelationContext` → removed; `CustomContext` redefined as a standalone interface (no base type needed)
  - `NodeClient` → `TelemetryClient` (public v3 export from `applicationinsights`)
  - `EnvelopeTelemetry`, `EventData`, `ExceptionData`, `ExceptionDetails`, `RequestData` → replaced with local minimal stub interfaces as compile bridges
  - `addTelemetryProcessor` call cast to `any` (v3 expects `TelemetryItem` signature; call is removed in Phase 3)
- [x] Run `npm run build` to confirm clean compile
- **Status:** complete
- **Acceptance:** `tsc` exits clean. Runtime not yet correct.

### Phase 2: Fix `disableAppInsights` no-op

- [ ] Replace `_client.config.disableAppInsights = config.NODE_ENV === "dev"` with `samplingPercentage = 0`
- [ ] Update mock in `test/setup.ts` to drop `addTelemetryProcessor` and `disableAppInsights`
- [ ] Run `npm run test --workspace=backend` to confirm tests pass
- **Status:** pending
- **Acceptance:** Dev mode no longer sends telemetry; test suite passes.

### Phase 3: Replace `addTelemetryProcessor` with OTel SpanProcessor

- [ ] Export `asyncLocalStorage` from `telemetry.ts`
- [ ] Add Express middleware in `app.ts` that wraps each request in `asyncLocalStorage.run({}, next)` (before `logIdentifiers`)
- [ ] Remove fallback to `getCorrelationContext().requestContext` in `getContext()`
- [ ] Remove `CustomContext` interface and `ICorrelationContext` import from `telemetry.ts` (no longer needed after `getContext()` simplification)
- [ ] Write `TelemetryContextProcessor` implementing OTel `SpanProcessor`
- [ ] In the SpanProcessor's `onEnd`, call `appendContext` to merge `asyncLocalStorage` properties onto span attributes
- [ ] Migrate dev-mode console logging from `telemetryProcessor` into the SpanProcessor's `onEnd` (adapt `devLogRequest`/`devLogEvent` to read from span attributes; adapt `devLogException` to read from span events — or simplify to `console.log(span)` if full fidelity is not needed at first)
- [ ] Register the SpanProcessor via `Configuration.setAzureMonitorOptions({ spanProcessors: [...] })`
- [ ] Verify `spanProcessors` field exists on `AzureMonitorOpenTelemetryOptions` type after install
- [ ] Update `logIdentifiers.test.ts` and `inputValidators.test.ts`: replace `getCorrelationContext` mocks with `asyncLocalStorage.run({}, ...)` wrappers; assert against the store object rather than `correlationContext.requestContext.prop` (see findings.md §Test Impact)
- [ ] Remove `getCorrelationContext` mock from `test/setup.ts` (if present) and from individual test files
- [ ] Run `npm run test --workspace=backend` to confirm tests pass
- **Status:** pending
- **Acceptance:** Properties from `logProperty()` / `logCounter()` appear on request spans in Application Insights; test suite passes.

### Phase 4: ESM instrumentation hook

- [ ] Confirm `@opentelemetry/instrumentation` is available (transitive dep of v3); add as explicit devDependency if not
- [ ] Add `--import @opentelemetry/instrumentation/hook.mjs` to the `start` script (`node --import ... dist/app.js`)
- [ ] Add `--import @opentelemetry/instrumentation/hook.mjs` to the `dev` script (`tsx watch --import ... --env-file=./.env ./src/app.ts`) — confirm `tsx` respects the flag or use `node --import tsx --import ... --env-file=./.env ./src/app.ts` if not
- [ ] Do **not** add the hook to the `test` script — telemetry is fully mocked in tests and the real OTel hook is not needed
- **Status:** pending
- **Acceptance:** Express request spans appear automatically without a manual `trackRequest` call.

### Phase 5: Validate / remove `telemetryWorkaround.cjs`

- [ ] Temporarily import `applicationinsights` directly in `telemetry.ts` (bypass the CJS shim)
- [ ] Start dev server and verify `defaultClient` is defined after `setup()`
- [ ] If ESM issue resolved: delete `telemetryWorkaround.cjs`, update `telemetry.ts` and `test/setup.ts`
- [ ] If ESM issue persists: keep the file but strip the now-unused `getCorrelationContext` export
- **Status:** pending
- **Acceptance:** `telemetryWorkaround.cjs` is either deleted or reduced to only what is needed.

### Phase 6: Integration smoke test

- [ ] Start backend pointing at a real (or emulator) Application Insights resource
- [ ] Make a sample API request; confirm request span appears with custom properties (visitorId, sessionId, etc.)
- [ ] Confirm `logError()` exceptions appear linked to the same operation
- [ ] Confirm `trackEvent()` events include context properties
- **Status:** pending
- **Acceptance:** End-to-end telemetry matches current v2 behaviour in the portal.

## Key Questions

1. Does the ESM `defaultClient` issue (GitHub #1354) still apply in v3? (Determine in Phase 5)
2. Is `spanProcessors` exposed on `AzureMonitorOpenTelemetryOptions` in the installed v3 version, or does it need a different field name? (Determine in Phase 3)
3. Does `samplingPercentage = 0` fully suppress export in v3, or is a different mechanism needed?
4. Does `tsx watch` honour `--import` flags passed alongside it, or must `dev` be switched to `node --import tsx ...` for the OTel hook to load first? (Determine in Phase 4)

## Decisions Made

| Decision                                                  | Rationale                                                                                                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ICorrelationContext` not re-exported from v3             | `ICorrelationContext` is defined in `applicationinsights/out/src/shim/types.d.ts` but not re-exported from the package's main entry. `CustomContext` was redefined as a standalone interface. |
| `addTelemetryProcessor` bridged with `as any` for Phase 1 | v3 `addTelemetryProcessor` expects `(envelope: TelemetryItem, ...) => boolean`; cast allows clean compile while the call site is removed entirely in Phase 3.                                 |
| Use `samplingPercentage = 0` for dev suppression          | `disableAppInsights` is unsupported in v3; sampling to 0 is the documented approach                                                                                                           |
| Replace TelemetryProcessor with OTel SpanProcessor        | `addTelemetryProcessor` silently no-ops in v3 — invisible regression                                                                                                                          |
| Switch to AsyncLocalStorage-only context                  | Mutable `requestContext` on the correlation context shim object is not stable in v3                                                                                                           |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       |         |            |
