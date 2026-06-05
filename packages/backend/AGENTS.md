# Backend

REST service that integrates with Azure Cosmos DB, Application Insights telemetry, LLM provider, and public ATS APIs.

Package-specific Tech Stack: Express, Application Insights, CosmosDB via dry-utils-cosmosdb, OpenAI via dry-utils-openai, node:test for tests

## Container-Friendly Cosmos Mocking

Important: Azure CosmosDB Emulator or an Azure CosmosDB account is required to run the backend API locally. Agents may not have this available depending on their environment.

When running in environments without a Cosmos DB emulator (such as AI agent containers), you can enable in-memory mocks powered by `dry-utils-cosmosdb`. The `dry-utils-cosmosdb-mockdb`skill will show you how.

The code is already set up to look for the `DATABASE_MOCK_DATA_JSON` (inline JSON) or `DATABASE_MOCK_DATA_PATH` (path to JSON file) environment variables.

## Development workflows

- Development server: `npm run start:backend`
- Environment variables are loaded from `.env`. See `src/config.ts`.

## Common Issues

`packages\backend\src\models\extractionModels.ts` shows that objects created by LLMs may have empty string ("") values to indicate absence. Any properties with "" is stripped from the object before it is saved into the DB. Therefore you can assume that objects coming out of the DB will not have empty properties.
