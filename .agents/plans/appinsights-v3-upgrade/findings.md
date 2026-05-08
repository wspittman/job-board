# Findings & Decisions: applicationinsights v2 → v3

## Requirements

- All custom properties accumulated per-request (`logProperty`, `logCounter`) must appear on telemetry items in Application Insights
- Dev mode must not send telemetry
- Exceptions logged via `logError()` must be linked to the surrounding request operation
- `trackEvent()` / `trackException()` call signatures must be unchanged
- Auto-instrumentation for Express requests and outbound HTTP must work
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

| v2 type                                                         | v3 replacement                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `CorrelationContext`                                            | `ICorrelationContext` (public export from `applicationinsights`)                        |
| `EnvelopeTelemetry`                                             | No equivalent — the telemetry processor that consumes it is replaced by a SpanProcessor |
| `EventData`, `RequestData`, `ExceptionData`, `ExceptionDetails` | No equivalent — replaced by OTel span attributes/events                                 |
| `NodeClient`                                                    | `TelemetryClient` (public export from `applicationinsights`)                            |

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

### 6. `telemetryWorkaround.cjs` — may still be needed

The CJS workaround exists to sidestep GitHub issue #1354: in v2's ESM build, the `defaultClient` getter fires before `setup()` because ESM eagerly evaluates exported properties. The v3 shim uses the same `export let defaultClient` pattern, so the issue likely persists. Must be verified empirically in Phase 5.

### 7. ESM instrumentation hook — missing

For ESM apps, OTel auto-instrumentation requires the hook to be loaded first:

```
node --import @opentelemetry/instrumentation/hook.mjs app.js
```

Without it, Express request spans and HTTP dependency spans are not captured. Must be added to `dev` and `start` scripts.

## Technical Decisions

| Decision                                           | Rationale                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Use `samplingPercentage = 0` for dev suppression   | `disableAppInsights` is unsupported in v3; sampling to 0 is the documented approach |
| Replace TelemetryProcessor with OTel SpanProcessor | `addTelemetryProcessor` silently no-ops in v3 — invisible regression                |
| Switch to AsyncLocalStorage-only context           | Mutable `requestContext` on the correlation context shim object is not stable in v3 |

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
- Dummy connection string in `config.ts` (`InstrumentationKey=dummy_key`) — still works for tests

## Risk Assessment

| Area                                    | Risk                                                  | Mitigation                              |
| --------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `addTelemetryProcessor` silently no-ops | **High** — context enrichment breaks without error    | Phase 3 is required before shipping     |
| Mutable correlation context             | **High** — accumulated properties silently dropped    | Phase 3a (AsyncLocalStorage middleware) |
| `disableAppInsights` no-op in dev       | **Medium** — telemetry sent unexpectedly in dev       | Phase 2, quick fix                      |
| ESM hook missing                        | **Medium** — no auto-instrumentation for HTTP/Express | Phase 4 required                        |
| Deep import paths                       | **Low** — compile errors surface immediately          | Phase 1 fixes all                       |
| `telemetryWorkaround.cjs` unknown       | **Low** — may still be needed                         | Phase 5 verifies empirically            |

## Technical Decisions

| Decision                                                     | Rationale                                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Upgrade in phases, not all at once                           | Phases 1–2 are safe to merge independently; Phase 3 is the bulk of work and warrants its own PR                                        |
| Prefer `asyncLocalStorage` exclusively for request context   | Removes dependency on the v3 shim's unstable `requestContext` mutation pattern                                                         |
| Use `Configuration.setAzureMonitorOptions` for SpanProcessor | Documented v3.6.0+ API; keeps usage within the `applicationinsights` shim rather than directly touching `@azure/monitor-opentelemetry` |

## Resources

- [applicationinsights v3 README](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/README.md)
- [applicationinsights CHANGELOG](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/CHANGELOG.md)
- [v3 shim source — applicationinsights.ts](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/src/shim/applicationinsights.ts)
- [v3 shim source — correlationContextManager.ts](https://github.com/microsoft/ApplicationInsights-node.js/blob/main/src/shim/correlationContextManager.ts)
- [ESM support — OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md)
- [GitHub issue #1354 — ESM defaultClient](https://github.com/microsoft/ApplicationInsights-node.js/issues/1354)
