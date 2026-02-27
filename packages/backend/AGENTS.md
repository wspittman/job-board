# Backend

REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.

Package-specific Tech Stack: Express, Application Insights, CosmosDB via dry-utils-cosmosdb, OpenAI via dry-utils-openai, node:test for tests

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Container-Friendly Cosmos Mocking

Important: Azure CosmosDB Emulator or an Azure CosmosDB account is required to run the backend API locally. Agents may not have this available depending on their environment.

When running in environments without a Cosmos DB emulator (such as AI agent containers), you can enable in-memory mocks powered by `dry-utils-cosmosdb`:

1. Create a JSON object keyed by container name (`company`, `job`, etc.).
2. Provide it through `DATABASE_MOCK_DATA_JSON` (inline JSON) or `DATABASE_MOCK_DATA_PATH` (path to JSON file).
3. Start the backend normally; `connectDB` will use the mock state/query handlers instead of reaching Azure Cosmos DB.

If both variables are set, file-based options load first and inline JSON overrides duplicate container keys.

Example JSON:

```json
{
  "company": [{ "id": "acme", "ats": "greenhouse", "name": "Acme" }],
  "job": [
    {
      "id": "job-1",
      "companyId": "acme",
      "title": "Engineer",
      "status": "open"
    }
  ]
}
```

## Development workflows

- Development server: `npm run start:backend`
- Production build: `npm run build --workspace=backend` followed by `npm run start --workspace=backend`; artifacts are emitted to `dist/`.
- Environment variables are loaded from `.env`. See `src/config.ts` for values such as `DATABASE_URL`, `LLM_MODEL`, `LLM_REASONING_EFFORT`, `OPENAI_API_KEY`, `ADMIN_TOKEN`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`.

## Testing style

- Tests run via `npm test --workspace=backend`.
- The shared `test/setup.ts` file sets default env vars and stubs telemetry/database/server bootstrapping; keep new tests compatible with those defaults.
- Use the built-in `node:test` runner with `suite`/`test` blocks and `assert/strict` expectations. Prefer table-driven cases (arrays of inputs iterated with `forEach`) to cover variants succinctly, as seen in `test/config.test.ts` and `test/middleware/*.test.ts`.
- Rely on `node:test` mocks (e.g., `mock.fn`, `mock.method`) to stub Express responses or helper modules. Reset mock call counts in `beforeEach` instead of recreating objects per test when practical.
- Keep test helpers small and colocated in the file (e.g., `mockRequest`, `validator`, `formatter`) and name tests with descriptive, data-driven strings built from the inputs.
