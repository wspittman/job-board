# Project Overview

This is a web application for a job board. It is a monorepo with multiple workspaces that cover the public web experience, a replacement frontend that is under active development, operational tooling, evaluation scripts, and the Node.js/Express backend API.

## Workspaces

- **`packages/backend`** – Express 5 + TypeScript API service that integrates with Azure Cosmos DB and Application Insights telemetry. Commands are executed from the repo root:
  - `npm run start:backend` to run `tsx watch src/app.ts` for development.
  - `npm run build --workspace=backend` / `npm run start --workspace=backend` for production artifacts under `dist/`.
  - Environment is configured through `.env`; see `packages/backend/src/config.ts` for variables such as `DATABASE_URL`, `LLM_MODEL`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`.
- **`packages/frontend`** – Current Vite-powered React application that uses Material-UI, React Router, and TanStack Query.
  - `npm run start:frontend` (alias of `npm run dev --workspace=frontend`) runs Vite with HMR.
  - `npm run build --workspace=frontend` emits assets to `packages/frontend/dist/` and `npm run preview --workspace=frontend` serves them.
  - Production hosting relies on `server.js`; set `API_URL` and optional `PORT`.
- **`packages/frontend2`** – Next-generation Vite React frontend with similar API expectations to the current app.
  - Change into the workspace or use `--workspace=frontend2` scripts (`dev`, `build`, `preview`, `start`).
  - Shares the same `API_URL`/`PORT` environment variables as `frontend`.
- **`packages/admin`** – TypeScript CLI for administrative operations.
  - Execute with `npm run admin -- <command> [args]` from the repo root.
  - Requires `.env` values `ADMIN_API_BASE_URL` (trailing slash) and `ADMIN_API_TOKEN`.
  - Supports commands like `add-companies` and `delete-job` against the backend admin API.
- **`packages/evals`** – Local evaluation harness that mirrors backend LLM extraction logic.
  - Fetch ATS input samples with `npm run eval-fetch-input -- <dataModel> <ats> <companyId> [jobId]`.
  - Run evaluations via `npm run eval -- <dataModel> [runName]`; results stored under `input/`, `ground/`, `outcome/`, and `report/`.
  - Relies on backend `.env` variables including `OPENAI_API_KEY`, `LLM_MODEL`, and `LLM_REASONING_EFFORT`.

# Building and Running

## Prerequisites

- Node.js >=22.0.0
- Azure CosmosDB Emulator or an Azure CosmosDB account

## Installation

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

## Running the application

1. Start the backend server:
   ```bash
   npm run start:backend
   ```
2. In a separate terminal, start the frontend development server:
   ```bash
   npm run start:frontend
   ```

# Development Conventions

- The project uses a monorepo structure with workspaces for the frontend and backend.
- The backend is written in TypeScript and uses Express.js.
- The frontend is a React application built with Vite.
- API routes are defined in `packages/backend/src/routes/routes.ts`.
- The frontend uses Material-UI for UI components.
- The project uses `eslint` for linting.

### Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines.

### Dependencies

Avoid adding new dependencies and warn when you do.

## Scratchpad

Two directories are provided for ad-hoc experimentation by agents: `agent_notes` and `agent_scripts`.

- `agent_notes`: Agents SHOULD store notes, ideas, and plans if they will be useful beyond the current task. These should be stored as .md markdown files.
- `agent_scripts`: Agents SHOULD store short-lived scripts and experiments here in .js JavaScript files.
