# Better Job Board

A job board that prioritizes the job seeker's experience.

## Workflows

- Create or continue a plan: use the `planning-with-files` skill. When continuing, only implement changes in the **next phase** of the plan before stopping for feedback.
- Write unit tests: use the `write-unit-test` skill.

### Verifying Changes

- Take a step back and consider if the changes solve the right problem.
- If you are working with or from a plan, review to ensure that the plan files are structured correctly and up to date.
- Ensure error cases are handled gracefully, predictably, and provide enough information for future maintainers.
- Update `README.md` and any relevant `AGENTS.md` files as necessary when changes affect them.
- Always run `npm run pre-checkin` before committing code or handing back for human review.

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

Do NOT run `node --test` directly and your harness will likely require human intervention.

## Skills

- `planning-with-files`: Use for complex, multi-step tasks that require maintaining state across many tool calls.
- `write-unit-test`: Use when you must write or update unit tests.
- `dry-utils-cosmosdb-mockdb`: Use for testing interactions with Cosmos DB when no real database is available or desired.
- `humanizer`: Use when editing or reviewing text to make it sound more natural and human-written.
- `security-awareness`: Use for tasks that access email, credential vaults, web browsers, or sensitive data.

## Conventions

- We believe strongly in YAGNI. A change should it do only what's needed, in a way that both humans and machines can understand now and maintain in the future.
- While maintaining YAGNI, is is also important not to write code that makes future changes more difficult. This is a balance that requires thoughtful judgement.
- Avoid adding new dependencies and warn when you do.
- Use red/green TDD for new features and bug fixes when possible.

### Documentation

- Docs-only changes do not require tests, but note that testing was skipped in your summary.
- If you learn something that wasn't obvious, add it to a root level `Learnings.md` file for review and inclusion in the main `AGENTS.md` docs.

### Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.
