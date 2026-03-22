# Frontend

This package contains the second iteration of the Job Board frontend. It is a Vite-powered vanilla HTML/CSS/JS application intended as a near-future replacement for the existing frontend experience.

## Getting started

From the repository root install dependencies if you have not already:

```bash
npm install
```

Then change into this workspace and run one of the available scripts.

```bash
cd packages/frontend
```

### Available scripts

- `npm run dev` – Starts the Vite development server on `http://localhost:5173` with hot module reloading.
- `npm run test` – Runs the Vitest suite for frontend TypeScript modules.
- `npm run build` – Type-checks the project and builds an optimized production bundle in `deploy/dist/`.
- `npm run start` – Launches the minimal Express server (`server.js`) used to host the built assets.
- `npm run start:local` – Serves the built output from `deploy/server.js` for local production verification.

## Project structure

```
packages/frontend/
├── public/           # Static assets copied as-is during build
├── src/
│   ├── api/          # Data-fetching utilities shared across pages
│   ├── components/   # Reusable UI building blocks
│   ├── home/         # Home page logic and styles
│   ├── explore/      # Explore page logic and styles
│   ├── faq/          # FAQ page logic and styles
│   ├── 404/          # 404 page logic and styles
│   ├── partials/     # Layout pieces such as headers, footers, and hero sections
│   └── sharedStyles/ # Global CSS modules and tokens
├── plugins/          # Vite plugins and supporting utilities
├── server.js         # Express wrapper for production hosting
└── vite.config.ts    # Vite configuration for the workspace
```

## Environment variables

The development server relies on the backend proxy defined in `vite.config.ts`. For production, `server.js` reads these variables:

| Variable  | Description                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `PORT`    | Port used by the Express static file server (defaults to `8080`).                                         |
| `API_URL` | Base URL for proxied API requests, including the `/api` prefix (defaults to `http://localhost:3000/api`). |

## Troubleshooting

- Ensure the backend service is running (or `API_URL` points to a deployed instance) so proxied API calls succeed during development and production.
