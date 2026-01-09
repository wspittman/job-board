# Project Overview

This is a web application for a job board. It is a monorepo with multiple workspaces that cover the public web experience, a legacy frontend that is being deprecated, operational tooling, evaluation scripts, and the Node.js/Express backend API.

## Workspaces

- **`packages/backend`** – Express 5 + TypeScript API service that integrates with Azure Cosmos DB and Application Insights telemetry. See `packages/backend/AGENTS.md` for backend-specific commands and conventions.
- **`packages/frontend`** – Current Vite-powered application built with vanilla HTML/CSS/JS. See `packages/frontend/AGENTS.md` for frontend-specific commands and conventions.
- **`packages/ops`** – TypeScript CLI for operational scripts that take actions against a running backend API instance.
  - Execute with `npm run ops -- <command> [args]` from the repo root.
  - Requires `.env` values like `PROD_API_TOKEN` and `LOCAL_API_TOKEN`.
  - Supports commands like `add-companies` and `delete-job` against the backend admin API.
- **`packages/lab`** – Script lab for evals and intermediate data collection that need direct access to backend-only logic or data (not surfaced via API).
  - Fetch ATS input samples with `npm run lab -- fetch-input <dataModel> <ats> <companyId> [jobId]`.
  - Run evaluations via `npm run lab -- evals <dataModel> [runName]`; results stored under `input/`, `ground/`, `outcome/`, and `report/`.
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
- Prefer running linting and formatting from the repo root via `npm run lint` and `npm run format` (or `npm run format:write` to apply fixes).
- Workspace-specific tools and workflows are described in the corresponding `AGENTS.md` files.
- Keep `README.md` and any relevant `AGENTS.md` files updated when code or workflow changes affect them.

### Comments

Use JSDoc comments for all public APIs and complex logic. This helps with code readability and provides useful information for developers using the code. Go light on comments otherwise. Never put comments at the end of lines. When writing @returns comments for async functions, prefer to describe the resolved value rather than the promise itself.

### Dependencies

Avoid adding new dependencies and warn when you do.

### Testing expectations

- Follow workspace-specific linting, formatting, and testing guidance for code changes.
- Docs-only changes do not require tests, but note that testing was skipped in your summary.

## Scratchpad

Two directories are provided for ad-hoc experimentation by agents: `agent_notes` and `agent_scripts`.

- `agent_notes`: Agents SHOULD store notes, ideas, and plans if they will be useful beyond the current task. These should be stored as .md markdown files.
- `agent_scripts`: Agents SHOULD store short-lived scripts and experiments here in .js JavaScript files.
