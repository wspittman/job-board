# Project Overview

Web application for a job board, an npm workspaces monorepo.

Common Tech Stack: TypeScript, Node, Eslint, Prettier, Tsx

## Workspaces

- `packages/backend`: REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.
- `packages/frontend`: MPA site client with server-side wrapper for production hosting.
- `packages/cli`: CLI for development and operational tasks, including API interaction, direct ATS data fetching, end-to-end testing, LLM evaluations, and playground experiments.

Each workspace has its own `README.md` and `AGENTS.md` with more details on setup, commands, and conventions. Refer to those for workspace-specific guidance.

# Available Commands

Run the following commands from the root of the repository:

- `npm run pre-checkin`: Run lint, format, and tests.
- `npm run lint`: Lint all workspaces.
- `npm run format`: Apply formatting fixes for all workspaces.
- `npm run test`: Run tests for the backend, frontend, and cli workspaces. Note: until Node v26, the concise dot reporter for node:test does not show details for failed tests, so if you need full output for backend or cli, use the following command.
- `npm run test-details --workspace=<workspace>`: Run tests for a specific workspace with the default reporter for full (but more verbose) output.
- `npm run start:backend`: Start the backend API in watch mode.
- `npm run start:frontend`: Start the frontend development server.
- `npm run cli`: Run a CLI command (see `packages/cli/AGENTS.md`).

# Available Skills

In addition to built-in skills, this repository includes custom skills.

- `write-unit-test`: Use when you must write or update unit tests. This skill helps to ensure that tests are written to match the surrounding workspace conventions.

# Development Conventions

- Workspace-specific tools and workflows are described in the corresponding `AGENTS.md` files.
- Dependencies: Avoid adding new dependencies and warn when you do.
- Docs-only changes do not require tests, but note that testing was skipped in your summary.
- Use red/green TDD for new features and bug fixes when practical.
- Quality checks: Always run `npm run pre-checkin` before committing code.

## Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.

## Documentation

- Keep `README.md` and any relevant `AGENTS.md` files updated when code or workflow changes affect them.
- If you learn something that wasn't obvious, add it to a root level `Learnings.md` file for review and inclusion in the main `AGENTS.md` docs.
