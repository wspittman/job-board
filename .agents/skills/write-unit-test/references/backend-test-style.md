# Backend unit-test style reference

Use this reference when editing `packages/backend/test/*`.

## Fixtures and helpers

- Mock only the request/response surface that the middleware or utility actually touches.
- Cast lightweight object literals to `Request` or `Response` when needed instead of building full Express objects.
  - Example: `{ json: jsonFn } as unknown as Response`

## Environment-sensitive modules

- Respect the defaults established in `packages/backend/test/setup.ts`.
- For config or import-time env behavior, reset `process.env` and import the module with a cache-busting query string.
- Do not re-bootstrap telemetry, database connections, or `app.listen` in individual tests unless the existing suite already does so.
