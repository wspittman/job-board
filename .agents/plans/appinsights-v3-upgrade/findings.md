# Findings & Decisions: applicationinsights v2 → v3

## Requirements

- All custom properties accumulated per-request (`logProperty`, `logCounter`) must appear on telemetry items in Application Insights
- Dev mode must not send telemetry
- Exceptions logged via `logError()` must be linked to the surrounding request operation
- `trackEvent()` / `trackException()` call signatures must be unchanged
- Auto-instrumentation for Express requests and outbound HTTP must work
- Dev console logs must show exactly one entry per inbound request
- Tests must continue to pass without a real Application Insights resource

## Core Difference: v2 vs v3

**v2** is a proprietary telemetry agent:

- Monkeypatches Node.js modules directly
- Uses `cls-hooked` for async context propagation
- Exposes an Application Insights-specific enrichment pipeline: `TelemetryProcessor` → `EnvelopeTelemetry` → Contracts types

**v3** is an OpenTelemetry shim:

- Internally wraps `@azure/monitor-opentelemetry` (the Azure Monitor OTel distro)
- Keeps most public `applicationinsights` call sites working via a backwards-compatibility layer
- Async context is tracked by the OTel context API (backed by `AsyncLocalStorage`)
- Enrichment is done through OTel `SpanProcessor`s, not TelemetryProcessors
- Configuration must be complete **before** calling `start()` — changes after `start()` have no effect

## Breaking Changes Inventory (this codebase)

### 1. Deep internal import paths (`telemetry.ts` lines 1–9)

All three imports use internal implementation paths that do not exist in v3:

```ts
import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager.js";
import type {
  EnvelopeTelemetry,
  EventData,
  ExceptionData,
  ExceptionDetails,
  RequestData,
} from "applicationinsights/out/Declarations/Contracts/index.js";
import type NodeClient from "applicationinsights/out/Library/NodeClient.js";
```

Replacements:

| v2 type                                                         | v3 replacement                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CorrelationContext`                                            | `ICorrelationContext` exists in `applicationinsights/out/src/shim/types.d.ts` but is **not re-exported** from the package's public entry; `CustomContext` was redefined as a standalone interface with only `requestContext?: Bag` |
| `EnvelopeTelemetry`                                             | No equivalent — the telemetry processor that consumes it is replaced by a SpanProcessor                                                                                                                                            |
| `EventData`, `RequestData`, `ExceptionData`, `ExceptionDetails` | No equivalent — replaced by local minimal stub interfaces as Phase 1 compile bridge; removed in Phase 3                                                                                                                            |
| `NodeClient`                                                    | `TelemetryClient` (public export from `applicationinsights`)                                                                                                                                                                       |

### 2. `addTelemetryProcessor` — removed entirely

```ts
_client.addTelemetryProcessor(telemetryProcessor);
```

The v3 README states: _"TelemetryProcessors are not supported in the Application Insights 3.X SDK."_ The call is **silently ignored with no warning**, so context enrichment stops working invisibly. This is the highest-risk regression.

v3 replacement: OTel `SpanProcessor` registered via `Configuration.setAzureMonitorOptions({ spanProcessors: [...] })` (API available since v3.6.0).

### 3. Mutable `requestContext` on `CorrelationContext`

```ts
const context = telemetryWorkaround.getCorrelationContext() as CustomContext;
context.requestContext ??= {};
return context.requestContext;
```

In v2, `getCorrelationContext()` returns a stable, mutable CLS-hooked object that persists for the request lifetime. In v3, the shim reconstructs the object from the active OTel span on every call — mutations do not persist. Properties accumulated by `logProperty()` / `logCounter()` are silently dropped.

Fix: `asyncLocalStorage` already exists in `telemetry.ts`. Add Express middleware that calls `asyncLocalStorage.run({}, next)` per-request. `getContext()` can then rely on `asyncLocalStorage.getStore()` exclusively and drop the `getCorrelationContext()` fallback.

### 4. `_client.config.disableAppInsights` — unsupported in v3

```ts
_client.config.disableAppInsights = config.NODE_ENV === "dev";
```

Explicitly listed as unsupported in the v3 README. Silently ignored — telemetry is sent in dev mode.

Fix: `_client.config.samplingPercentage = 0` (or skip calling `start()`).

### 5. Tests relying on `getCorrelationContext` — will break in Phase 3

Two test files mock `getCorrelationContext` and assert that `logProperty()` writes into `correlationContext.requestContext`:

- `test/middleware/logIdentifiers.test.ts` — mocks `getCorrelationContext`, asserts `correlationContext.requestContext.prop`
- `test/middleware/inputValidators.test.ts` — same pattern for `useBeacon`

After Phase 3 removes the `getCorrelationContext()` fallback from `getContext()`, both tests will silently pass without verifying anything (the mock fires, but `getContext()` no longer reads from it).

Fix (Phase 3): Import `asyncLocalStorage` from `telemetry.ts` in both test files. Wrap each test call in `asyncLocalStorage.run({}, () => { ... })` and assert against the store object directly.

### 6. `telemetryWorkaround.cjs` — still needed in v3

The CJS workaround exists to sidestep GitHub issue #1354: in v2's ESM build, the `defaultClient` getter fires before `setup()` because ESM eagerly evaluates exported properties. The v3 shim uses the same `export let defaultClient` pattern — **confirmed in Phase 5: `defaultClient` remains `undefined` before and after `setup()` + `start()` when imported via native ESM**. `telemetryWorkaround.cjs` is retained, stripped to only `getClient` and `setup` (removed now-unused `getCorrelationContext`).

### 7. `samplingPercentage = 0` is inert when set after `start()`

The `disableAppInsights` fix in Phase 2 sets `_client.config.samplingPercentage = 0` after calling `start()`. This is currently inert: `start()` calls `parseConfig()` internally, which reads the sampling percentage at that moment (defaulting to 100%). Mutations to `_client.config.samplingPercentage` after that point have no effect on the sampler that was already initialized.

If dev suppression is required, it must be configured before `start()` — either via `setAzureMonitorOptions({ samplingRatio: 0 })` before calling `start()`, or by not calling `start()` at all in dev. Left as-is for now since the integration smoke test (Phase 6) will validate actual production telemetry behavior.

### 8. SERVER spans do not fire under Node v24 + ESM

**Investigation (2026-05-08):** Three separate probes were run with `--import ./register-otel.mjs`, all showing the same result: CLIENT spans for outbound `http.get()` fire correctly, but SERVER spans for inbound requests never appear in the processor.

**Root cause:** `module.register()` loads `hook.mjs` in an async worker thread. `import-in-the-middle` (IIMT) wraps the ESM-facing namespace's `http.Server.prototype.emit`. However, Node v24's internal HTTP engine constructs server instances using the **original unproxied prototype** — not the ESM-namespace proxy — when dispatching `request` events internally. The patch is on the wrong prototype object.

Verification: `http.createServer.toString()` returns a non-native string (wrapped), and `http.Server.prototype.emit.toString()` is also wrapped — so IIMT _is_ applied. But SERVER spans still do not fire. CLIENT spans work because outgoing `http.get()` calls go through the wrapped ESM export directly.

**`--experimental-loader` is not viable:** Running with `--experimental-loader=@opentelemetry/instrumentation/hook.mjs` exits with code 1 on Node v24. Not usable.

**Fix:** `requestSpanMiddleware()` exported from `telemetry.ts` creates manual `SpanKind.SERVER` spans via `trace.getTracer('express').startSpan(...)`. These flow through `TelemetryContextProcessor.onEnd` → `devLogSpan`, keeping all telemetry logic in one place, and ensure production HTTP telemetry reaches App Insights. Registered in `app.ts` before the `asyncLocalStorage.run` middleware so span context is active during `asyncLocalStorage.run({}, next)`.

**Correction (2026-05-08 follow-up):** Subsequent observation showed that IIMT _does_ produce SERVER spans for Express-hosted requests (unlike bare `http.createServer`). Express registers its request listener via `server.on('request', ...)` which goes through a code path that IIMT's prototype patch does intercept. The earlier probes used `http.createServer(handler)` directly and saw no SERVER spans because that handler registration bypasses the patched emit. The result is that both our manual `requestSpanMiddleware` spans and the auto-instrumentation SERVER spans fire for every request — one with `instrumentationScope.name === "express"` (manual), one from `@opentelemetry/instrumentation-http` (auto). See §11 for how this is resolved.

The middleware includes a comment noting it should be removed once OTel resolves the ESM/Node v24 SERVER span issue cleanly.

### 9. Invalid connection string crashes `trackException`

The dummy connection string default in `config.ts` was `"InstrumentationKey=dummy_key"`. This causes `useAzureMonitor()` (called inside `TelemetryClient.initialize()`) to throw on the invalid GUID format. `initialize()` catches the error silently, leaving the internal `_logApi` field `undefined`. A subsequent `_client.trackException()` call then throws `Cannot read properties of undefined`.

Fix: Changed the default to `"InstrumentationKey=00000000-0000-0000-0000-000000000000"` — a syntactically valid connection string that is accepted by the SDK without throwing.

### 10. ESLint fails on `register-otel.mjs`

`register-otel.mjs` cannot be added to `tsconfig.json` (it's plain JS, not TypeScript), and the shared ESLint config only ignored `**/*.js` and `**/*.cjs`. This caused a lint error on the new bootstrap file.

Fix: Added `"**/*.mjs"` to the `ignores` array in `eslint.base.config.js`.

### 11. Duplicate SERVER spans per request

With IIMT active via `register-otel.mjs`, every inbound Express request produces two SERVER spans:

1. The auto-instrumentation span from `@opentelemetry/instrumentation-http` (`instrumentationScope.name` = `@opentelemetry/instrumentation-http`)
2. The manual span from `requestSpanMiddleware` (`instrumentationScope.name` = `"express"`, tracer name passed to `trace.getTracer()`)

This caused two dev log entries per request and would export two HTTP request records to App Insights per call.

**Fix — dev logs:** Added guard in `devLogSpan`: `if (span.instrumentationScope.name !== "express") return;` — logs only the manual span, which carries the `asyncLocalStorage` context properties.

**Fix — App Insights export:** Added `instrumentationOptions: { http: { enabled: false } }` to `setAzureMonitorOptions`. This disables `@opentelemetry/instrumentation-http` entirely, preventing both the duplicate SERVER spans and the outbound CLIENT spans (to the App Insights ingestion endpoint, Cosmos DB, etc.) from being exported. Outbound HTTP dependency tracking must now be done explicitly via `logProperty` or `_client.trackDependency` where needed.

**Type reference:** `instrumentationOptions?: InstrumentationOptions` is defined on `AzureMonitorOpenTelemetryOptions` in `@azure/monitor-opentelemetry`. The `http` field accepts `InstrumentationConfig` from `@opentelemetry/instrumentation`, which includes `enabled?: boolean`.

### 7. ESM instrumentation hook — missing

For ESM apps, OTel auto-instrumentation requires the hook to be loaded first:

```
node --import @opentelemetry/instrumentation/hook.mjs app.js
```

Without it, Express request spans and HTTP dependency spans are not captured. Must be added to `dev` and `start` scripts.

## Technical Decisions

| Decision                                               | Rationale                                                                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use `samplingPercentage = 0` for dev suppression       | `disableAppInsights` is unsupported in v3; sampling to 0 is the documented approach — though the set-after-`start()` approach is currently inert (see §7)                                                             |
| Replace TelemetryProcessor with OTel SpanProcessor     | `addTelemetryProcessor` silently no-ops in v3 — invisible regression                                                                                                                                                  |
| Switch to AsyncLocalStorage-only context               | Mutable `requestContext` on the correlation context shim object is not stable in v3                                                                                                                                   |
| Manual `requestSpanMiddleware` for SERVER spans        | OTel HTTP auto-instrumentation does not fire SERVER spans under Node v24 ESM for bare `http.createServer`; does fire for Express but produces duplicates — manual span is the authoritative one (carries ALS context) |
| Changed default connection string to valid GUID format | `dummy_key` caused `useAzureMonitor()` to throw silently, leaving `_logApi` undefined and crashing `trackException`; valid GUID is accepted without side-effects                                                      |
| Disable HTTP auto-instrumentation                      | Prevents duplicate SERVER spans and noisy CLIENT spans in App Insights; see §11. Outbound dependency tracking must be added explicitly where needed.                                                                  |

## Resources

- `applicationinsights` v3 README and CHANGELOG — reviewed from the npm package (no stable URL; use `npm show applicationinsights readme`)
- GitHub issue #1354 — ESM `defaultClient` initialization order bug (referenced in breaking change §5)
- OTel `SpanProcessor` interface — `@opentelemetry/sdk-trace-base` package docs
- Azure Monitor OpenTelemetry distro — `@azure/monitor-opentelemetry` package docs

## What v3 Does NOT Change

- `setup()`, `start()`, `defaultClient` entry points — same API
- `trackEvent()`, `trackException()`, `trackMetric()`, `trackDependency()`, `trackRequest()` — same call signatures, routed through shim
- `getCorrelationContext()` — still works, returns `ICorrelationContext` derived from active OTel span
- `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable — still respected
- Dummy connection string in `config.ts` — changed to `InstrumentationKey=00000000-0000-0000-0000-000000000000` (valid GUID format required by v3's `useAzureMonitor()`; `dummy_key` caused a silent initialization failure; see §9)

## Risk Assessment

| Area                                    | Risk                                               | Mitigation / Status                                                |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `addTelemetryProcessor` silently no-ops | **High** — context enrichment breaks without error | ✅ Resolved in Phase 3 (OTel SpanProcessor)                        |
| Mutable correlation context             | **High** — accumulated properties silently dropped | ✅ Resolved in Phase 3 (AsyncLocalStorage middleware)              |
| `disableAppInsights` no-op in dev       | **Medium** — telemetry sent unexpectedly in dev    | ⚠️ Phase 2 sets `samplingPercentage = 0` but it is inert (§7)      |
| ESM hook missing / SERVER spans absent  | **Medium** — no request telemetry in dev or prod   | ✅ Resolved via `requestSpanMiddleware` workaround (Phase 4 + §8)  |
| Deep import paths                       | **Low** — compile errors surface immediately       | ✅ Resolved in Phase 1                                             |
| `telemetryWorkaround.cjs` unknown       | **Low** — may still be needed                      | ✅ Resolved in Phase 5 — retained, stripped to `getClient`/`setup` |

## Technical Decisions

| Decision                                                             | Rationale                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upgrade in phases, not all at once                                   | Phases 1–2 are safe to merge independently; Phase 3 is the bulk of work and warrants its own PR                                                                                                                                               |
| Prefer `asyncLocalStorage` exclusively for request context           | Removes dependency on the v3 shim's unstable `requestContext` mutation pattern                                                                                                                                                                |
| Use `Configuration.setAzureMonitorOptions` for SpanProcessor         | Documented v3.6.0+ API; keeps usage within the `applicationinsights` shim rather than directly touching `@azure/monitor-opentelemetry`                                                                                                        |
| Use `module.register()` bootstrap instead of `--experimental-loader` | `hook.mjs` only exports hook functions — no side effects on `--import`. `--experimental-loader` fails with exit code 1 on Node v24. `module.register()` is the supported path on Node v24 and isolates future migration to synchronous hooks. |
| Manual `requestSpanMiddleware` for SERVER spans                      | Bare `http.createServer` SERVER spans don't fire under Node v24 ESM/IIMT; Express requests do fire but produce duplicates. Manual span is authoritative (carries ALS context). HTTP auto-instrumentation disabled. See §8, §11.               |
| Changed default connection string to valid GUID format               | `InstrumentationKey=dummy_key` caused `useAzureMonitor()` to throw silently inside `TelemetryClient.initialize()`, leaving `_logApi` undefined and crashing subsequent `trackException` calls (see §9).                                       |
| Disable HTTP auto-instrumentation (`instrumentationOptions`)         | Prevents duplicate SERVER spans and noisy CLIENT spans (App Insights ingestion, Cosmos DB) from polluting the portal. See §11.                                                                                                                |

## Resources

- [applicationinsights v3 README](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/README.md)
- [applicationinsights CHANGELOG](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/CHANGELOG.md)
- [v3 shim source — applicationinsights.ts](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/src/shim/applicationinsights.ts)
- [v3 shim source — correlationContextManager.ts](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/src/shim/correlationContextManager.ts)
- [ESM support — OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md)
- [GitHub issue #1354 — ESM defaultClient](https://github.com/microsoft/ApplicationInsights-node.js/issues/1354)
