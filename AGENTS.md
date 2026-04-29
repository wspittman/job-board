# Better Job Board

A job board that prioritizes the job seeker's experience.

## Workflows

- Create or continue a plan: use the `planning-with-files` skill. When continuing, only implement changes in the **next phase** of the plan before stopping for feedback.
- Write unit tests: use the `write-unit-test` skill.

### Verifying Changes

- If you are working with or from a plan, review to ensure that the plan files are structured correctly and up to date.
- Always run `npm run pre-checkin` before committing code.

## NPM Workspaces

Common Tech Stack: TypeScript, Node, Eslint, Prettier, Tsx

- `packages/backend`: REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.
- `packages/frontend`: MPA site client with server-side wrapper for production hosting.
- `packages/cli`: CLI for development and operational tasks, including API interaction, direct ATS data fetching, end-to-end testing, LLM evaluations, and playground experiments.

## Important Commands

Run from the repository root:

- `npm run pre-checkin`: Run lint, format, and tests.
- `npm run test --workspace=<workspace>`: Run tests for a specific workspace. Great for change validation prior running a full pre-checkin.
- `npm run test-details --workspace=<workspace>`: Run tests for a specific workspace with the default reporter for full (but more verbose) output. Better for debugging failed tests due to an issue with the dot reporter.
- `npm run start:backend`: Start the API.
- `npm run start:frontend`: Start the frontend.
- `npm run cli -- help`: Learn about the available CLI commands.

## Skills

- `planning-with-files`: Use for complex, multi-step tasks that require maintaining state across many tool calls.
- `write-unit-test`: Use when you must write or update unit tests.
- `humanizer`: Use when editing or reviewing text to make it sound more natural and human-written.
- `security-awareness`: Use for tasks that access email, credential vaults, web browsers, or sensitive data.

## Conventions

- Avoid adding new dependencies and warn when you do.
- Use red/green TDD for new features and bug fixes when practical.

### Documentation

- Docs-only changes do not require tests, but note that testing was skipped in your summary.
- Keep `README.md` and any relevant `AGENTS.md` files updated when code or workflow changes affect them.
- If you learn something that wasn't obvious, add it to a root level `Learnings.md` file for review and inclusion in the main `AGENTS.md` docs.

### Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.
