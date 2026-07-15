# Development Progress — Smart Mini-Ledger

A phase-by-phase log of what we've built, so anyone (including future us) can pick up
the context quickly.

**Stack:** React + Vite + TypeScript + Tailwind (frontend) · Node + Express + TypeScript
+ Prisma (backend) · Postgres (Docker) · JWT auth · Nodemailer (Gmail) · Docker Compose.

**Repo layout:** monorepo — `/backend` (done so far), `/frontend` (upcoming), root
`docker-compose.yml`.

---

## ✅ Phase 0 — Backend scaffold & Docker

- TypeScript Express structure: `config`, `controllers`, `middlewares`, `routes`,
  `services`, `utils`, `types`, `validators`.
- Prisma schema: `User` + `Transaction` (with `isDeleted` soft-delete flag).
- Typed env loader (`config/env.ts`), Prisma singleton (`config/db.ts`), central
  error handler + 404, health route, graceful shutdown.
- Multi-stage `Dockerfile` + `docker-compose.yml` (Postgres + backend).
- **Verified:** typecheck passes, server boots on `:5001`, `/api/health` + 404 work.
- **Fixes AI missed:** port 5000 taken by macOS AirPlay → moved to 5001; TS 7 removed
  `moduleResolution: "node"` → switched to `nodenext`.

## ✅ Phase 1 — Auth (email/password)

- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **zod** validation (`validators/auth.schema.ts`) with email normalization
  (trim + lowercase) and field-level error messages.
- bcrypt password hashing, JWT issue/verify (`utils/`), `requireAuth` middleware.
- Security: password hash never returned; generic login error (no account
  enumeration); duplicate-email guard (409).
- **Verified:** 7-case flow test all green.

## ✅ Phase 2 — Core ledger (transactions + summary)

- Endpoints (all require auth, scoped to the logged-in user):
  - `POST /api/transactions` — add (amount, type, category, note?, date?)
  - `GET /api/transactions` — list, newest first
  - `GET /api/transactions/summary` — total income, total expense, balance
  - `DELETE /api/transactions/:id` — **soft delete** (sets `isDeleted`, powers Undo later)
- zod schema rounds money to 2 decimals so float noise never hits the DB.
- Summary uses a single Prisma `groupBy` (efficient, no in-memory looping over rows).
- **Verified:** add/list/delete/summary + validation + ownership + no-auth all tested.

---

## 🔜 Roadmap

| Phase | What | Status |
|-------|------|--------|
| 3 | **Stats engine** → Confidence Score · Cash Burn Meter · Expense Velocity · Monthly Replay | next |
| 4 | Smart Duplicate Detection + Undo window | |
| 5 | **Frontend** — editorial UI: auth, dashboard, Spending DNA, Money Timeline, Money Calendar (heatmap) | |
| 6 | Email notification (Nodemailer + Gmail) — high-spend smart alert | |
| 7 | Polish — error/empty/loading states, responsive, dark mode | |
| 8 | Deploy live | |

## Notes / decisions

- **Currency:** ₹ INR throughout. Money stored as `Float`, rounded to 2dp on input.
- **Auth model:** multi-user; all ledger data scoped by `userId`.
- **Twists confirmed:** Spending DNA, Money Timeline, Money Calendar (heatmap),
  Smart Duplicate, Undo, and the stats engine (Confidence/Burn/Velocity/Replay).
  Cut: Pattern Detection, Achievements.
