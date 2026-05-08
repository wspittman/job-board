# Task Plan: Upgrade applicationinsights v2 → v3

## Goal

Upgrade the backend from `applicationinsights` v2 to v3 without regressions in
context enrichment, dev-mode suppression, or auto-instrumentation.

## Current Phase

Phase 4

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

- [x] Replace `_client.config.disableAppInsights = config.NODE_ENV === "dev"` with `if (config.NODE_ENV === "dev") { _client.config.samplingPercentage = 0; }`
- [x] Update mock in `test/setup.ts`: replace `config: { disableAppInsights: true }` with `config: { samplingPercentage: 0 }` (kept `addTelemetryProcessor` mock — still called until Phase 3)
- [x] Run `npm run test --workspace=backend` to confirm tests pass
- **Status:** complete
- **Acceptance:** Dev mode no longer sends telemetry; test suite passes.

### Phase 3: Replace `addTelemetryProcessor` with OTel SpanProcessor

- [x] Export `asyncLocalStorage` from `telemetry.ts`
- [x] Add Express middleware in `app.ts` that wraps each request in `asyncLocalStorage.run({}, next)` (before `logIdentifiers`)
- [x] Remove fallback to `getCorrelationContext().requestContext` in `getContext()`
- [x] Remove `CustomContext` interface from `telemetry.ts`
- [x] Write `TelemetryContextProcessor` implementing OTel `SpanProcessor`
- [x] In `onEnd`, merge `asyncLocalStorage` store keys onto span attributes (objects JSON-serialized, primitives/arrays passed through)
- [x] Migrate dev-mode console logging into `devLogSpan()` — reads span name, HTTP status code, duration, and `store["prop"]` for request context; reads exception events for errors
- [x] Register via `Configuration.setAzureMonitorOptions({ spanProcessors: [...] })` called on the return value of `telemetryWorkaround.setup()`
- [x] `spanProcessors` confirmed present on `AzureMonitorOpenTelemetryOptions` in v3.14.0 (Key Question 2 resolved: ✅)
- [x] Remove Phase 1 compile-bridge stub interfaces and `telemetryProcessor` / `appendContext` functions
- [x] Update `logIdentifiers.test.ts` and `inputValidators.test.ts`: replaced `getCorrelationContext` mocks with `asyncLocalStorage.run({}, ...)` wrappers; assert against `asyncLocalStorage.getStore()["prop"]`
- [x] Removed `addTelemetryProcessor` from test mock client; added `setAzureMonitorOptions` to `setup` mock return
- [x] Run `npm run test --workspace=backend` — 255 tests pass
- **Status:** complete
- **Acceptance:** Properties from `logProperty()` / `logCounter()` appear on request spans in Application Insights; test suite passes.

### Phase 4: ESM instrumentation hook

**Approach:** Use `module.register()` via a `--import` bootstrap file rather than `--experimental-loader`.

- `hook.mjs` re-exports `initialize`, `load`, `resolve` etc. from `import-in-the-middle` — it has no side effects when imported directly, so `--import hook.mjs` does nothing. It must be passed to `module.register()`.
- `--experimental-loader` works but is deprecated by Node.js (may be removed). The documented successor is `module.register()` called from a `--import`-preloaded file.
- `module.register()` itself was deprecated in Node v25.9 in favour of `module.registerHooks()` (synchronous hooks), but v24 (current: v24.14.1) treats it as stable. The bootstrap file approach isolates the change so it's easy to update when OTel adds synchronous hook support.

- [ ] Confirm `@opentelemetry/instrumentation` is available as a transitive dep; add as explicit devDependency if not
- [ ] Create `packages/backend/register-otel.mjs` that calls `register('@opentelemetry/instrumentation/hook.mjs', import.meta.url)` from `node:module`
- [ ] Update `start` script: `node --import ./register-otel.mjs dist/app.js`
- [ ] Update `dev` script: `tsx watch --import ./register-otel.mjs --env-file=./.env ./src/app.ts` (confirmed: `tsx` honours `--import`)
- [ ] Do **not** add the hook to the `test` script — telemetry is fully mocked in tests
- **Status:** pending
- **Acceptance:** Express request spans appear automatically without a manual `trackRequest` call; no deprecation warnings on startup.

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
2. Is `spanProcessors` exposed on `AzureMonitorOpenTelemetryOptions` in the installed v3 version, or does it need a different field name? **Resolved in Phase 3: `spanProcessors?: SpanProcessor[]` is present in v3.14.0.**
3. Does `samplingPercentage = 0` fully suppress export in v3, or is a different mechanism needed?
4. Does `tsx watch` honour `--import` flags passed alongside it, or must `dev` be switched to `node --import tsx ...` for the OTel hook to load first? **Resolved: `tsx` honours `--import` flags (confirmed v4.21.0 / Node v24.14.1).**

## Decisions Made

| Decision                                                             | Rationale                                                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ICorrelationContext` not re-exported from v3                        | `ICorrelationContext` is defined in `applicationinsights/out/src/shim/types.d.ts` but not re-exported from the package's main entry. `CustomContext` was redefined as a standalone interface.                                      |
| `addTelemetryProcessor` bridged with `as any` for Phase 1            | v3 `addTelemetryProcessor` expects `(envelope: TelemetryItem, ...) => boolean`; cast allows clean compile while the call site is removed entirely in Phase 3.                                                                      |
| Use `samplingPercentage = 0` for dev suppression                     | `disableAppInsights` is unsupported in v3; sampling to 0 is the documented approach                                                                                                                                                |
| Replace TelemetryProcessor with OTel SpanProcessor                   | `addTelemetryProcessor` silently no-ops in v3 — invisible regression                                                                                                                                                               |
| Switch to AsyncLocalStorage-only context                             | Mutable `requestContext` on the correlation context shim object is not stable in v3                                                                                                                                                |
| Use `module.register()` bootstrap instead of `--experimental-loader` | `hook.mjs` only exports hook functions — no side effects on `--import`. `--experimental-loader` works but is deprecated. `module.register()` is the supported path on Node v24 and isolates future migration to synchronous hooks. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       |         |            |
