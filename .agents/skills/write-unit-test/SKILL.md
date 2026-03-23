---
name: write-unit-test
description: Use when you must write or update unit tests. This skill helps to ensure that tests are written to match the surrounding workspace conventions.
---

# Write Unit Test

Write the smallest useful test that matches the target workspace's existing patterns.

## Workflow

1. Identify the workspace and file under test.
2. Read every scoped `AGENTS.md` plus the nearest existing tests before writing anything.
3. Look for the local framework and assertion style.
4. Look for any existing helpers, patterns, and table-driven cases..
5. Consider what inputs and outputs will prove the intended behavior without being too broad or too narrow.
6. Write a narrow test with concrete inputs and expected outputs, while matching these existing patterns.

## Guidance

- Avoid new dependencies for testing unless the user explicitly needs them.
- If you learn a non-obvious repository convention while writing tests, add it to `Learnings.md` in the repo root.

## Style-matching rules

- Mirror the nearest existing test file in naming, fixture setup, mocking style, and helper placement.
- Keep helpers small and colocated unless several files already share a helper.
- Prefer deterministic assertions on exact outputs and exact mock-call behavior.
- Add comments only for genuinely tricky timing, mocking, or environment behavior.
- Cover the specific regression first; expand to adjacent cases only when the existing suite clearly favors case tables.

## Workspace Specifics

When the target is `packages/backend`, use `node:test` and read `references/node-test-style.md` and `references/backend-test-style.md` before editing tests.
When the target is `packages/frontend`, use `vitest` with the `jsdom` environment and read `references/frontend-test-style.md` before editing tests.
When the target is `packages/lab` or `packages/ops`, use `node:test` and read `references/node-test-style.md` before editing tests.

## Validation

Before finishing:

- make sure the new test fails without the code fix when practical to verify it is meaningful;
- confirm the test passes after the change;
- check that formatting and lint expectations still hold for the edited files.
