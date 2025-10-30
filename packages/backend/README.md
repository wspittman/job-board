# Backend Service

The backend package implements the API for the Job Board monorepo. It is an Express application written in TypeScript that applies security middleware, exposes all REST routes under `/api`, and boots after Cosmos DB connectivity is established.

## Features

- **Express 5 + TypeScript** – JSON body parsing, CORS, and Helmet configuration are baked in for a secure baseline.
- **Cosmos DB integration** – Uses the `dry-utils-cosmosdb` helpers to provision containers for companies, jobs, metadata, and cached locations at startup.
- **Telemetry** – Application Insights is initialized as the first step in the boot process and provides structured logging helpers used throughout the service.

## Getting Started

1. Install workspace dependencies from the repository root:
   ```bash
   npm install
   ```
2. Create an `.env` file and supply the required environment variables listed below.
3. Start the backend in watch mode from the repository root:
   ```bash
   npm run start:backend
   ```
   This runs `tsx watch` against `src/app.ts`, recompiling on change.
4. To create a production build, run:
   ```bash
   npm run build --workspace=backend
   ```
   The compiled files are emitted to `dist/` by `tsc`.

## Environment Variables

Configuration is handled in `src/config.ts`. Defaults exist for local development, but you should override them in production deployments.

| Variable                                | Description                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `PORT`                                  | HTTP port for the Express server (defaults to `3000`).                                            |
| `NODE_ENV`                              | Controls behavior such as telemetry suppression in development (defaults to `dev`).               |
| `DATABASE_URL` / `DATABASE_KEY`         | Endpoint and key for the Azure Cosmos DB account. Emulator defaults are included for local usage. |
| `DATABASE_LOCAL_CERT_PATH`              | Path to the exported Cosmos DB emulator certificate when running locally.                         |
| `GREENHOUSE_URL` / `LEVER_URL`          | Base URLs for ATS integrations fetched by the data ingestion jobs.                                |
| `LLM_MODEL` / `LLM_REASONING_EFFORT`    | OpenAI model identifier and optional reasoning setting used by AI-powered features.               |
| `OPENAI_API_KEY`                        | Consumed implicitly by the OpenAI SDK when AI features are enabled.                               |
| `ADMIN_TOKEN`                           | Required shared secret protecting administrative endpoints (minimum 16 characters).                                                |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Connection string for Application Insights telemetry collection.                                  |
| `ENABLE_VERBOSE_BLOB_LOGGING`           | Enables expanded telemetry payload logging when set to `true`.                                    |

## Project Structure

```
packages/backend/
├── src/
│   ├── app.ts          # Express entry point and server bootstrap
│   ├── config.ts       # Environment-driven configuration
│   ├── controllers/    # Route handlers for domain features
│   ├── db/             # Cosmos DB initialization and helpers
│   ├── middleware/     # Shared Express middleware
│   ├── models/         # TypeScript models for persisted entities
│   ├── routes/         # Route registration
│   ├── types/          # Shared type definitions
│   └── utils/          # Cross-cutting utilities (telemetry, errors, etc.)
├── tests/              # Integration and unit tests
└── tsconfig.json       # TypeScript compiler settings
```

## Useful Commands

- `npm run dev --workspace=backend` – Start the service with automatic reloads via `tsx watch`.
- `npm run build --workspace=backend` – Compile TypeScript to JavaScript in `dist/`.
- `npm run start --workspace=backend` – Run the compiled server from `dist/app.js`.

## Troubleshooting

- Ensure the Cosmos DB emulator certificate is exported to `packages/backend/cosmosdbcert.cer` when running locally so TLS connections succeed.
- If telemetry should be disabled during local development, leave `NODE_ENV` as `dev` or omit `APPLICATIONINSIGHTS_CONNECTION_STRING`.
