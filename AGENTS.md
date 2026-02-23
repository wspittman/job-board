# Project Overview

Web application for a job board, an npm workspaces monorepo.

## Workspaces

- `packages/backend`: REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.
- `packages/frontend`: MPA site client with server-side wrapper for production hosting.
- `packages/ops`: CLI for operational scripts that take actions against a running backend API instance.
- `packages/lab`: CLI for evals and intermediate data collection that need direct access to backend-only logic or data (not surfaced via API).

Each workspace has its own `README.md` and `AGENTS.md` with more details on setup, commands, and conventions. Refer to those for workspace-specific guidance.

# Available Commands

Run the following commands from the root of the repository:

- `npm run pre-checkin`: Run lint, format check, and tests.
- `npm run lint`: Lint all workspaces.
- `npm run format`: Check formatting for all workspaces.
- `npm run format:write`: Apply formatting fixes for all workspaces.
- `npm test`: Run tests for backend workspace (the only workspace with tests currently).
- `npm run start:backend`: Start the backend API in watch mode.
- `npm run start:frontend`: Start the frontend development server.
- `npm run lab -- <command>`: Run a lab CLI command (see `packages/lab/AGENTS.md`).
- `npm run ops -- <command>`: Run an ops CLI command (see `packages/ops/AGENTS.md`).

# Development Conventions

- Workspace-specific tools and workflows are described in the corresponding `AGENTS.md` files.
- Documentation: Keep `README.md` and any relevant `AGENTS.md` files updated when code or workflow changes affect them.
- Dependencies: Avoid adding new dependencies and warn when you do.
- Quality checks: Always run `npm run pre-checkin` before committing code.

## Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.

## Testing expectations

- Follow workspace-specific linting, formatting, and testing guidance for code changes.
- Docs-only changes do not require tests, but note that testing was skipped in your summary.
