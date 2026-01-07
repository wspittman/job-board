# Admin workspace instructions

This package contains the TypeScript CLI for administrative operations against the backend API. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run admin -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- Examples: `npm run admin -- add-companies greenhouse name1 name2` or `npm run admin -- delete-job name1 job1`.
- Environment variables are loaded from `.env`. See `src/config.ts` for keys (e.g., `PROD_API_TOKEN`, `LOCAL_API_TOKEN`).

## Code conventions

- Use JSDoc comments for public APIs and complex logic. Avoid trailing inline comments. For async @returns descriptions, describe the resolved value rather than the promise itself.
- Avoid adding new dependencies and call out any additions in your summary.

## Quality checks

Always run the following before committing changes:

- Lint: `npm run lint --workspace=admin`.
- Format: `npm run format:write --workspace=admin`
