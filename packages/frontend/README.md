# Frontend Application

The frontend package delivers the React single-page application for the Job Board monorepo. It is built with Vite, styled with Material UI, and coordinates data access through TanStack Query with Axios-powered API clients.

## Features

- **Vite + React 19** – Fast refresh and modern JSX transforms with TypeScript type-safety throughout the app.
- **Material UI design system** – Centralized theming in `src/theme.ts` plus composable components under `src/components/` keep the UI consistent.
- **Data fetching with TanStack Query** – Hooks in `src/hooks/` and service helpers in `src/services/` handle caching, loading states, and error boundaries.
- **Client-side routing** – React Router pages live in `src/pages/` with layout scaffolding in `src/frame/`.
- **Production express wrapper** – `server.js` serves the built assets and proxies API calls to the backend for deployments.

## Getting Started

1. Install workspace dependencies from the repository root:
   ```bash
   npm install
   ```
2. Run the development server from the repository root:
   ```bash
   npm run start:frontend
   ```
   This calls `vite` in watch mode with hot module replacement.
3. To create an optimized production build, run:
   ```bash
   npm run build --workspace=frontend
   ```
   Compiled assets are emitted to `packages/frontend/dist/`.
4. Preview the production build locally:
   ```bash
   npm run preview --workspace=frontend
   ```
   Vite serves the prebuilt assets on the configured port.

## Environment Variables

The development server relies on the backend proxy defined in `vite.config.ts`. For production, `server.js` reads these variables:

| Variable   | Description |
| ---------- | ----------- |
| `PORT`     | Port used by the Express static file server (defaults to `8080`). |
| `API_URL`  | Base URL for proxied API requests, including the `/api` prefix (defaults to `http://localhost:3000/api`). |

## Project Structure

```
packages/frontend/
├── public/              # Static assets copied as-is into the build output
├── src/
│   ├── App.tsx          # Root component wiring routes and layout
│   ├── components/      # Reusable presentational and form components
│   ├── frame/           # Shell, navigation, and layout primitives
│   ├── hooks/           # Custom hooks (queries, theming, utilities)
│   ├── pages/           # Route-level pages composed from components/hooks
│   ├── services/        # Axios instances and API request helpers
│   ├── theme.ts         # Material UI theme configuration
│   └── main.tsx         # Vite entry point that hydrates React
├── eslint.config.js     # Shared ESLint configuration for the package
├── server.js            # Express server used in production builds
└── vite.config.ts       # Vite build and dev server configuration
```

## Useful Commands

- `npm run dev --workspace=frontend` – Start the Vite dev server with HMR.
- `npm run lint --workspace=frontend` – Lint the source files with ESLint.
- `npm run build --workspace=frontend` – Generate an optimized production bundle.
- `npm run start --workspace=frontend` – Serve the built assets via the Express wrapper.

## Troubleshooting

- Ensure the backend service is running (or `API_URL` points to a deployed instance) so proxied API calls succeed during development and production.
- When Material UI styles appear incorrect, confirm that the `@fontsource-variable/inter` package is loaded in `src/main.tsx` so typography tokens render as expected.
