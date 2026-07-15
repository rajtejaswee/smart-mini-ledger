# AI Journal — where AI helped & where human judgment was needed

A running log kept *during* development, so the README's "where the AI fell short"
section is honest and specific rather than invented at the end.

---

## Backend scaffolding (Phase 0) — TypeScript + Docker

**AI accelerated:** generated the Express + Prisma + TypeScript folder structure,
`package.json` scripts, typed env loader, Prisma singleton, error middleware, health
endpoint, multi-stage Dockerfile, and docker-compose in one pass.

**Where human judgment was needed:**

- **Port 5000 was silently broken on macOS.** The obvious default (`PORT=5000`) is
  hijacked by macOS **ControlCenter / AirPlay Receiver**, which listens on 5000. The
  server *printed* "running on 5000" but every request returned empty because
  ControlCenter intercepted it. Diagnosed with `lsof -iTCP:5000` and moved the API to
  **5001**. An AI defaulting to 5000 leaves a confusing failure on any Mac.

- **TypeScript 7 removed `moduleResolution: "node"`.** Standard AI-generated tsconfig
  uses `"moduleResolution": "node"`, which the new TS 7 native compiler rejects
  (`TS5108: Option 'moduleResolution=node10' has been removed`). Switched to
  `"nodenext"` — which still emits CommonJS here because the package has no
  `"type": "module"`. A stale AI template would have failed to compile.

- **Prisma client duplication in dev.** tsx/nodemon reloads can spawn many
  PrismaClient instances and exhaust DB connections. Cached the client on `globalThis`.

- **Prisma in a container needs openssl + the CLI at runtime.** For `prisma migrate
  deploy` to run inside the container, `prisma` must be a runtime dependency (not
  dev), and the slim Node image needs `openssl` installed — both easy to miss in a
  naive Dockerfile. Fixed in the multi-stage build.

- **Express 5 async error handling.** Relied on Express 5's built-in forwarding of
  rejected async handlers to the central error middleware (no `express-async-handler`
  wrapper needed) — AI boilerplate often targets Express 4 and gets this wrong.
