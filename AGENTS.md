# Project Overview

This is a web application for a job board. It is a monorepo with a React frontend and a Node.js/Express backend.

**Frontend:**

- React with Vite
- Material-UI for components
- TanStack Query for data fetching
- React Router for navigation

**Backend:**

- Node.js with Express.js
- TypeScript
- Azure CosmosDB for the database

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
