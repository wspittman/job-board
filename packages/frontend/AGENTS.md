# Frontend

A vanilla HTML/CSS/JS MPA site client with server-side wrapper for production hosting.

Package-specific Tech Stack: Vite, Express for production server wrapper, lucide for icons, @tanstack/query-core for data fetching state management

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Development server: `npm run start:frontend`.
- Production build: `npm run build --workspace=frontend` followed by `npm run start:local`; artifacts are emitted to `dist/`.
  - This uses `server.js`; configure `API_URL` and optionally `PORT` for the Express static file server.

## Quality checks

In addition to running `npm run pre-checkin` from the repo root, validate UI changes with a development server if possible.
