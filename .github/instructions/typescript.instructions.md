---
applyTo: "**/*.ts"
---

The `job-board` repo is a backend/frontend monorepo that uses TypeScript for both the backend and frontend codebases.
We always use fully-typed TypeScript.
We avoid adding new dependencies unless absolutely necessary.
We JSDoc public functions. If the function is incredibly simple then we omit @params and @returns for brevity.
We comment complex or confusing code, but we don't comment simple or self-explanatory code.
We avoid end-of-line comments.

The backend is a Node.js / Express application.
We use the LTS version of Node.js.
We use axios for HTTP requests.
The tests are always written in Node's built-in `node:test` framework.

The frontend is a React application via Vite.
We use MUI for the UI components and Lucide for the icons.
