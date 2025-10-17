# Frontend 2

This package contains the second iteration of the Job Board frontend. It is a Vite-powered React application that renders the marketing site (home, FAQ, explore, and 404 pages) that complements the primary dashboard experience.

## Getting started

From the repository root install dependencies if you have not already:

```bash
npm install
```

Then change into this workspace and run one of the available scripts.

```bash
cd packages/frontend2
```

### Available scripts

- `npm run dev` – Starts the Vite development server on `http://localhost:5173` with hot module reloading.
- `npm run build` – Type-checks the project and builds an optimized production bundle in `dist/`.
- `npm run preview` – Serves the previously built bundle locally for verification.
- `npm run start` – Launches the minimal Express server (`server.js`) used to host the built assets.

## Project structure

```
packages/frontend2/
├── public/           # Static assets copied as-is during build
├── src/
│   ├── api/          # Data-fetching utilities shared across pages
│   ├── components/   # Reusable UI building blocks
│   ├── pages/        # Route-specific React entry points (index, explore, FAQ, 404)
│   ├── partials/     # Layout pieces such as headers, footers, and hero sections
│   └── sharedStyles/ # Global CSS modules and tokens
├── plugins/          # Vite plugins and supporting utilities
├── server.js         # Express wrapper for production hosting
└── vite.config.ts    # Vite configuration for the workspace
```

## Environment variables

The marketing experience does not currently rely on environment variables. If you add configuration in the future, document it here so the setup remains self-contained.

## Related packages

The broader Job Board application also contains the main dashboard frontend in `packages/frontend` and the API server in `packages/backend`. Changes in those workspaces may require coordinating updates here to keep navigation and shared resources aligned.
