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

## ✅ Phase 3 — Stats engine (4 smart twists from 1 module)

- One service `services/insights.service.ts` derives everything from a user's
  transactions (pure aggregation + ratios, no external data).
- Endpoints (all auth-scoped):
  - `POST /api/insights/confidence` — is this amount unusual vs the category average?
    Flags outliers and guesses an "extra zeros" typo fix (50000 → suggests 500).
  - `GET /api/insights/burn` — balance, ₹/day burn rate, days-remaining projection.
  - `GET /api/insights/velocity` — rolling last-7-days vs prior-7-days spend + direction.
  - `GET /api/insights/replay?month=YYYY-MM` — earned, spent, biggest expense, top
    category, avg daily spend for a month (defaults to current).
- `utils/date.ts` — month/week/day helpers.
- **Verified:** confidence (outlier + normal), burn, velocity, replay all tested with
  seeded + dated transactions; numbers hand-checked.

## ✅ Phase 4 — Smart Duplicate Detection + Undo

- **Duplicate guard on create:** same amount + type + category recorded within 30s
  → responds `409` with `code: "POSSIBLE_DUPLICATE"` and the existing tx, so the UI can
  show "Add anyway?". Sending `force: true` skips the guard and saves.
- **Undo:** `POST /api/transactions/:id/restore` un-deletes a soft-deleted tx (powers
  the 10s Undo toast). Scoped to owner; 404 if not deleted.
- `ApiError` now carries a machine-readable `code` for clean frontend handling.
- **Verified:** duplicate → 409, force → 201, delete→restore round-trip, 404 cases.

## 🚧 Phase 5 — Frontend (in progress)

**Foundation shipped & verified working:**
- Vite + React + TS + **Tailwind v4** + Manrope (self-hosted) + Lucide + Recharts + axios.
- Design system in `index.css` (@theme): Apple-inspired tokens — colors (#2563EB primary,
  income/expense, ink/muted), radii (btn/input 12, card/chart 18), soft shadows, 8pt
  spacing, subtle rise/fade motion, accessible focus rings.
- UI primitives: `Button`, `Card`, `Field`, `Logo`, `ErrorBanner`; `cn` helper.
- Auth: `AuthContext` (JWT in localStorage, restore session via `/auth/me`), axios client
  with token interceptor, Vite `/api` proxy to backend.
- Screens: **Login**, **Signup** (wired to backend), protected **Dashboard** showing live
  summary — balance (count-up), income, expenses.
- Verified: typecheck + prod build pass; both servers run; login works through the proxy.

**Premium dashboard redesign (after feedback it felt too plain):**
- Reference target: Finora-style finance dashboard. Chose **dark sidebar + light bento grid**.
- **App shell:** dark fixed sidebar (logo, nav, profile, sign-out) + light plane content;
  responsive (mobile top bar).
- **Bento dashboard** with real charts (used the dataviz skill — validated categorical
  palette, thin marks, custom tooltips):
  - Balance hero: count-up + **area chart** of running balance + trend badge + runway note.
  - KPI cards: income / expenses this month with month-over-month **trend badges**.
  - **Spending DNA donut** (top-5 categories + Other, legend, insight line).
  - Recent activity list (category icons), Monthly recap card.
- Data derivation client-side (`derive.ts`): running balance series, category breakdown,
  % change; category→icon map (`categories.ts`).
- Verified: typecheck + build pass. Seeded `demo@ledger.app` / `demo1234` (28 txns, 2 months).

**Add-transaction form (ties together 3 twists):**
- Accessible `Modal` (framer-motion, ESC/backdrop close, scroll lock) + dark Gmail-style
  `ToastProvider` (auto-dismiss, action buttons).
- `AddTransactionModal`: type toggle, ₹ amount, category + quick-pick chips, note, date.
- **Confidence Score:** debounced `/insights/confidence` call → amber "this looks unusual"
  warning + one-tap "Did you mean ₹500?" suggestion.
- **Duplicate detection:** 409 `POSSIBLE_DUPLICATE` → inline "Add anyway?" confirm →
  resends with `force: true`.
- **Undo:** success toast with 8s "Undo" → deletes the just-added tx + reloads.
- Dashboard: "Add transaction" button + mobile FAB; `reload()` refreshes all widgets.
- Verified: typecheck + build pass; clean dev reload.

**Money Timeline + Money Calendar (multi-page nav):**
- Sidebar now uses real routes (Dashboard / Timeline / Calendar via NavLink); added a
  mobile bottom nav bar; extracted a reusable `AddTransactionButton` used on every page.
- **Timeline** (`/timeline`): month-navigable vertical timeline grouped by day with a
  connecting line, income/expense colored dots, per-day net.
- **Calendar** (`/calendar`): month heatmap grid — each day shaded by spend via a
  single-hue expense ramp (color-mix), click a day → side panel with that day's
  transactions. Month navigation, "today" marker.
- Shared `useLedger` hook (transactions + month nav); `lib/month.ts` (grouping,
  calendar cells, weekday helpers).
- Verified: typecheck + build pass.

**Phase 5 core is essentially complete** — auth, dashboard, add flow (confidence /
duplicate / undo), timeline, calendar.

**UI elegance pass (after reviewing real screenshots via Playwright):**
- Verified the actual rendered UI with headless screenshots, then polished against reality.
- **Dark statement balance hero** — navy gradient card with balance, area chart, and
  income/expense folded in as mini-stats (creates the luxury focal point; removed the
  empty KPI cards).
- **Login → split-screen** — dark branded panel (headline + feature bullets) + form,
  replacing the "card floating in a void".
- **Editorial eyebrow labels** (uppercase, letter-spaced) across cards; layered shadows
  for depth; staggered card entrance.
- **Filled dead space** — savings-rate bar in "This month"; calendar auto-selects the
  latest active day + heatmap legend.
- Verified: typecheck + build pass; re-screenshotted to confirm.

**Settings (closes the last Phase 5 gap — the sidebar's "Soon" chip is now a real page):**
- Backend, two new auth endpoints:
  - `PATCH /api/auth/me` — update `name` / `monthlyIncome`. Partial update: only keys the
    client sends are applied, so omitting one never wipes it; `monthlyIncome: null` clears
    it. Money rounded to 2dp like every other amount.
  - `POST /api/auth/change-password` — verifies the current password (401 +
    `code: "INVALID_PASSWORD"`), rejects reusing the same one (400), then re-hashes → 204.
- **Settings page** (`/settings`): Profile card (name + optional monthly income), Password
  card (current / new / confirm), Account card (email, member-since, sign out). Save is
  disabled until the form is dirty; saves push the fresh user into `AuthContext` via a new
  `updateUser`, so the sidebar updates instantly.
- Settings is now a real `NavLink` in the sidebar + mobile bottom nav.
- **Verified end-to-end, not just typecheck:** 11 curl cases against the live backend
  (persist, clear-to-null, negative → 400, no-auth → 401, wrong current → 401, same
  password → 400, change → 204, old password → 401, new password → 200) + Playwright drive
  of the real page (sidebar nav, dirty-gating, toast, persistence across reload, sidebar
  name update, inline error on wrong password, client-side mismatch catch, mobile).
- Note: `monthlyIncome` is now settable but no engine reads it yet — `insights.getBurn`
  still projects purely from transactions. Wiring it in is a fair follow-up.

## ✅ Phase 6 — High-spend email alert (Nodemailer + Gmail)

- **Trigger = the Confidence engine, not a fixed threshold.** `shouldAlert` reuses
  `checkConfidence`, so "high" means high *for you, in this category* — ₹4,000 on coffee
  is alarming, ₹4,000 on rent is a Tuesday. Fires only on **expenses**, only on the
  **large** side (ratio ≥ 3; Confidence also flags unusually *small* amounts), and only
  with ≥3 prior transactions in that category.
- **Ordering matters:** the decision runs *before* the insert — `checkConfidence` averages
  every row in the category, so saving first would let a transaction dilute the very
  baseline it's measured against and hide its own spike.
- `services/email.service.ts` — lazy Nodemailer transport. Two invariants: email is
  optional (no credentials → app runs fine, alerts skipped) and `sendMail` never throws.
- `services/alert.service.ts` — decision (`shouldAlert`) split from delivery
  (`sendHighSpendAlert`) so the rule is testable without SMTP. Delivery is fire-and-forget
  from `createTransaction` (`void runHighSpendAlert(...)`): SMTP latency can't slow the
  201 and a bounce can't fail it.
- `utils/emailTemplates.ts` — inline-styled table email (Gmail strips `<style>`), branded
  dark header + teal CTA, ₹ formatting, HTML-escaped user input, plaintext alternative.
- **Opt-out:** new `User.emailAlerts` column (default true, migration
  `add_email_alerts_pref`) + a Notifications toggle on the Settings page that saves on
  flip. Alerting people with no off switch isn't acceptable.
- **Verified against a live Ethereal SMTP inbox** (real send, not a stub) — 11/11:
  25× spike → alert; normal → none; 3× exactly (threshold) → alert; just under 3× → none;
  unusually *small* → none; large INCOME → none; thin history → none; `createTransaction`
  sends exactly one mail with the right subject/recipient; a normal amount right after a
  spike still doesn't alert (baseline unpolluted); `emailAlerts=false` → none; **dead SMTP
  → transaction still saves**. Rendered email screenshotted and reviewed.
- Fix caught while verifying: the `Toggle` knob had no `left`, so it resolved against the
  static position and rendered outside the track — now pinned `left-1` with 20px travel.
- ⚠️ **Inert until configured:** the code path is live but sends nothing until
  `EMAIL_USER` / `EMAIL_APP_PASSWORD` (Gmail App Password, needs 2FA on the account) are
  set in `backend/.env`. Without them it logs a skip — by design, so the repo clones and
  runs with no credentials.

## 🔜 Roadmap

| Phase | What | Status |
|-------|------|--------|
| 0 | Backend scaffold & Docker | ✅ |
| 1 | Auth (email/password, JWT) | ✅ |
| 2 | Core ledger (transactions + summary) | ✅ |
| 3 | Stats engine (Confidence / Burn / Velocity / Replay) | ✅ |
| 4 | Smart Duplicate Detection + Undo | ✅ |
| 5 | **Frontend** — editorial UI: auth, dashboard, Spending DNA, Timeline, Calendar, Settings | ✅ |
| 6 | Email notification (Nodemailer + Gmail) — high-spend smart alert | ✅ |
| 7 | Polish — error/empty/loading states, responsive, dark mode | 🔜 Next |
| 8 | Deploy live | |

**Roughly 6 of 8 phases done** — every feature is built; what's left is polish and
shipping.

### What Phase 7 still needs
- **First-run empty state** — individual cards handle empty fine (`RecentTransactions`,
  `SpendingDnaCard`), but a brand-new account still lands on a page of zeros with no
  page-level "add your first transaction" nudge.
- **Error states** — `Dashboard.load()` is `load().finally(() => setLoading(false))` with
  no `.catch`. On a failed API call `data` stays null, so the skeleton grid renders
  forever (plus an unhandled rejection). Needs a caught error + retry. *Verified, not
  assumed.*
- **Delete/undo on Timeline & Calendar** — restore exists in the API and the add-flow
  toast, but there's no delete affordance on those pages.
- **Dark mode** — moot: the app is already dark-only after the neon redesign. Either drop
  this from the roadmap or add a real light theme.
- **Responsive re-check** at tablet widths.

### ✅ Loose ends — all three fixed

**1. `monthlyIncome` now drives the burn projection.** `getBurn` reads the user's monthly
income and, when set, projects on the **net** burn (spend/day minus expected income/day):
- income covers spend → `sustainable: true`, no run-out date; the hero shows
  "Income covers your spending — balance projected to grow"
- income helps but doesn't cover → runway computed from net burn (longer, honest)
- no income on file → exactly the old gross behaviour (`netBurnPerDay: null`)
New `Burn` fields: `monthlyIncome`, `netBurnPerDay`, `sustainable`.

**2. Alert rate limit: one email per user+category per 24h.** New `AlertLog` table
(migration `add_alert_log`) records each *delivered* alert; `runHighSpendAlert` skips if
that category alerted in the last 24h. Only real sends are logged, so a failed/skipped
delivery doesn't start the clock — a retry after an SMTP failure still alerts.

**3. Bundle split: entry chunk 851 kB → 410 kB.** Route-level `React.lazy` for all six
pages with a `Suspense` + `FullScreenLoader` fallback. Recharts (~373 kB) now loads only
with the Dashboard chunk; Timeline/Calendar/Settings are 3–6 kB each.

**Verified:** 9/9 harness cases against live Ethereal SMTP + real Postgres (burn math for
none/high/low income — net/day hand-checked; spike → 1 email; two more same-category
spikes → still 1; different category → its own email; AlertLog row counts; failed send
doesn't start the 24h clock; retry after failure still alerts). Playwright: all lazy
routes render, sustainable runway note shows on the hero, zero console errors.

## Notes / decisions

- **Currency:** ₹ INR throughout. Money stored as `Float`, rounded to 2dp on input.
- **Auth model:** multi-user; all ledger data scoped by `userId`.
- **Twists confirmed:** Spending DNA, Money Timeline, Money Calendar (heatmap),
  Smart Duplicate, Undo, and the stats engine (Confidence/Burn/Velocity/Replay).
  Cut: Pattern Detection, Achievements.
