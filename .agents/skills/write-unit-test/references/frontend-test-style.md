# Frontend unit-test style reference

Use this reference when editing `packages/frontend/src/**/*.test.ts`.

## Framework and primitives

- Import `suite`, `test`, and any needed helpers from `vitest`.
- Use `vi.fn` and other `vi` mocks instead of third-party mocking libraries.

## Preferred structure

- Group tests with `suite(...)`.
- Prefer dense, table-driven cases over many small bespoke tests
  - Lean on arrays `test.for(...)` when several variants exercise the same behavior.
  - This is used even when the case matrix gets fairly large or slightly hard to scan.
- Generate practical test names from case data when that keeps the file compact.
  - It is normal to build names from inputs
  - Example: test("Invalid location: $loc", ...)

## Fixtures and helpers

- Keep helpers file-local.
- If a test needs to define a property that is not available through JSDOM, define the property as part of testSetup.ts.

## Non-idiomatic but accepted local patterns

- Mechanical test names are fine if they clearly identify the case.
- Slightly dense case matrices are preferred over many repetitive test blocks.
