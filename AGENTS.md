# Project Overview

This is a web application for a job board. It is a monorepo with multiple workspaces that cover the public web experience, a legacy frontend that is being deprecated, operational tooling, evaluation scripts, and the Node.js/Express backend API.

## Workspaces

- **`packages/backend`** – Express 5 + TypeScript API service that integrates with Azure Cosmos DB and Application Insights telemetry. Commands are executed from the repo root:
  - `npm run start:backend` to run `tsx watch src/app.ts` for development.
  - `npm run build --workspace=backend` / `npm run start --workspace=backend` for production artifacts under `dist/`.
  - Environment is configured through `.env`; see `packages/backend/src/config.ts` for variables such as `DATABASE_URL`, `LLM_MODEL`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`.
- **`packages/frontend`** – Current Vite-powered application that uses vanilla HTML/CSS/JS with TanStack Query.
  - `npm run start:frontend` (alias of `npm run dev --workspace=frontend`) runs Vite with HMR.
  - `npm run build --workspace=frontend` emits assets to `packages/frontend/dist/` and `npm run preview --workspace=frontend` serves them.
  - Production hosting relies on `server.js`; set `API_URL` and optional `PORT`.
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

- Node.js >=24.0.0
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
- The frontend is a vanilla HTML/CSS/JS application built with Vite.
- API routes are defined in `packages/backend/src/routes/routes.ts`.
- The `backend` and `frontend` packages use `eslint` for linting.
- The `backend` and `frontend` packages use `prettier` for code formatting.
- Prefer running linting and formatting from the repo root via `npm run lint` and `npm run format` (or `npm run format:write` to apply fixes).

### Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.

### Dependencies

Avoid adding new dependencies and warn when you do.

### Testing expectations

- Backend code changes: run `npm test --workspace=backend` when feasible. Also run `npm run lint --workspace=backend` and `npm run format --workspace=backend` (or `npm run format:write --workspace=backend` to autofix) before committing.
- Frontend code changes: run `npm run lint --workspace=frontend` and `npm run format --workspace=frontend` (or `npm run format:write --workspace=frontend` to autofix).
- Docs-only changes do not require tests, but note that testing was skipped in your summary.

## Scratchpad

Two directories are provided for ad-hoc experimentation by agents: `agent_notes` and `agent_scripts`.

- `agent_notes`: Agents SHOULD store notes, ideas, and plans if they will be useful beyond the current task. These should be stored as .md markdown files.
- `agent_scripts`: Agents SHOULD store short-lived scripts and experiments here in .js JavaScript files.
