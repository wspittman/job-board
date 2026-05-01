# Backend

REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.

Package-specific Tech Stack: Express, Application Insights, CosmosDB via dry-utils-cosmosdb, OpenAI via dry-utils-openai, node:test for tests

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
- Environment variables are loaded from `.env`. See `src/config.ts`.
