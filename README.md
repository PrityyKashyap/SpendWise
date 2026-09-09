# SpendWise

Full-stack personal finance and expense-splitting application.

**Track → Analyze → Split → Settle → Remind**

- [`IDEA.md`](IDEA.md) — the product brief
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — architecture, schema, API, algorithms, MVP scope

## Stack

React 19 · Vite 8 · Tailwind v4 · React Router 7 · Axios
Node 26 · Express 5 · MongoDB 8 · Mongoose 9

## Prerequisites

- Node.js 20+
- MongoDB running locally, or a MongoDB Atlas connection string

```bash
# macOS, local MongoDB
brew services start mongodb-community
```

## Setup

This is an npm workspace, so dependencies for all three packages install with
one command at the repo root.

```bash
# 1. Install everything (root, client, server, shared)
npm install

# 2. Configure the backend
cd server
cp .env.example .env
# Generate two DIFFERENT secrets and paste them into .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Seed the shared default categories (once)
npm run seed

# 4. Run the API
npm run dev                       # → http://localhost:5001

# 5. Run the client (a second terminal, from the repo root)
cd client && cp .env.example .env && npm run dev    # → http://localhost:5173
```

The server refuses to start if `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are
missing, shorter than 32 characters, or identical — a misconfigured secret
should fail loudly, not run in a state that only looks secure.

Open http://localhost:5173 and create an account. The diagnostic page at
http://localhost:5173/status reports live API and database status — if it says
the API is unreachable, the backend is not running or is on a different port.

> **Port note (macOS):** the API uses **5001**, not 5000. AirPlay Receiver
> occupies port 5000 and binds with `SO_REUSEPORT`, so Node reports a
> successful listen but never receives requests.

## Verify the backend directly

```bash
curl http://localhost:5001/api/health
```

```json
{ "success": true,
  "data": { "status": "ok", "database": { "status": "connected", "name": "spendwise" } } }
```

## Layout

```
shared/         validation schemas imported by BOTH sides, so a rule
                is defined exactly once (see shared/README.md)

server/src/
  config/       env validation (fail-fast), database connection
  routes/       thin: path + middleware + controller
  controllers/  HTTP only — read request, call service, send response
  services/     ALL business logic; no req/res, unit-testable
  models/       Mongoose schemas
  middleware/   error handling, rate limiting, auth (Phase 2)
  utils/        ApiError, logger, money (integer paise)

client/src/
  pages/        one per route
  components/   ui/ primitives · layout/ · feature folders
  services/     the ONLY place axios is called
  context/      auth, toasts
  hooks/        reusable logic
  utils/        money, dates, validators
```

## Conventions

**Money is always integer paise.** ₹8,000.00 is stored, sent and calculated as
`800000`. Floats cannot represent decimal currency exactly, and in a splitting
app that error compounds until group balances stop summing to zero. Conversion
happens only at the form boundary (`toPaise`) and at display (`formatMoney`).

**The access token never touches localStorage.** It lives in React state; a
7-day refresh token in an httpOnly cookie restores the session on reload and is
rotated on every use. See ARCHITECTURE.md §5.

**All API responses use one envelope:**

```jsonc
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## Phases

| | Phase | Status |
|---|---|---|
| 1 | Foundation — setup, React, Express, MongoDB, config | ✅ Complete |
| 2 | Authentication — register, login, JWT, protected routes | ✅ Complete |
| 3 | Personal finance — income, expenses, categories, dashboard | ✅ Complete |
| 4 | Analytics — charts, monthly reports | ✅ Complete |
| 5 | Groups — create, members, group expenses | ✅ Complete |
| 6 | Splitting — equal, exact, percentage, shares | ✅ Complete |
| 7 | Settlements — balances, debt simplification | ✅ Complete |
| 8 | Reminders — generate and copy messages | ✅ Complete — **MVP done** |
| 9 | Advanced — budgets, receipts, OCR, messaging, AI insights | |
| 10 | Deployment | |

## Deployment

See **[DEPLOY.md](DEPLOY.md)**. Run `bash scripts/predeploy-check.sh` first —
it verifies everything checkable locally (no committed secrets, clean build,
SPA rewrites, production guards) and lists the four variables you must set on
the hosts.

## Troubleshooting

### `ENOENT: ... client/node_modules/react-dom/index.js` on `npm run dev`

Vite caches where it found each dependency. This repo is an npm workspace, so
npm **hoists** shared packages such as `react` and `react-dom` up to the root
`node_modules/` — and if Vite's cache was written before that hoisting, it
still points at the old `client/node_modules/` path and the dev server fails
to start.

The production build is unaffected, because it resolves from scratch.

```bash
npm run clean     # clears client/node_modules/.vite and client/dist
```

Then start the dev server again. If it persists, `npm run reinstall` does a
full clean install of all three workspaces.

### Server exits immediately with "Missing required environment variable"

That is deliberate (`server/src/config/env.js`). Copy `server/.env.example` to
`server/.env` and fill in `MONGO_URI` plus two different 32-character JWT
secrets. Failing at boot with a clear message beats running in a state that
only looks secure.

### Categories are empty on a new install

Run `npm run seed --workspace server` once. The 17 system categories are
shared rows (`userId: null`), not per-account copies.

