# Deploying SpendWise

Everything in this repo is deploy-ready. What remains needs accounts only you
can create. `bash scripts/predeploy-check.sh` verifies the codebase side.

## Architecture

| Piece | Host | Why |
|---|---|---|
| Client (React SPA) | **Vercel** | Static files on a CDN; free tier is generous |
| API (Express) | **Render** | A persistent Node process |
| Database | **MongoDB Atlas** | Managed; free M0 tier is enough to start |

**Why not put the API on Vercel too.** It is a long-running Express app with a
Mongoose connection pool. On a serverless platform every cold start opens a new
pool, which burns through Atlas' connection cap and adds latency to the first
request after each idle period. A persistent process is the right shape here.

---

## Step 1 — MongoDB Atlas (required first)

Nothing can be deployed until the database is reachable from the internet. The
app currently points at `mongodb://127.0.0.1:27017`, which no host can reach.

1. Create a free account at <https://www.mongodb.com/cloud/atlas>
2. **Build a Database** → **M0 Free** → pick a region near your users
3. **Database Access** → Add a user with a strong password. Save it.
4. **Network Access** → Add IP Address → `0.0.0.0/0`
   Render's outbound IPs are not fixed on the free plan. Access is still
   protected by the username and password; the database is not open to anyone
   without credentials.
5. **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/spendwise?retryWrites=true&w=majority
   ```
   Append the database name `spendwise` before the `?`, as shown.

## Step 2 — Generate production secrets

Do **not** reuse the development ones in `server/.env`.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # JWT_REFRESH_SECRET
```

They must be different from each other. The server refuses to start otherwise.

## Step 3 — Push to GitHub

Both hosts deploy from a repository. There are no commits yet.

```bash
git add -A
git commit -m "SpendWise: full-stack expense tracker and splitter"
gh repo create spendwise --private --source=. --push   # or create it on github.com and:
# git remote add origin https://github.com/<you>/spendwise.git
# git branch -M main && git push -u origin main
```

Confirm `server/.env` is **not** in the commit — the pre-deploy check verifies this.

## Step 4 — Deploy the API to Render

1. <https://render.com> → **New** → **Blueprint** → connect the repo.
   `server/render.yaml` is picked up automatically.
   (Or **New → Web Service** with build `npm install`, start `npm start --workspace server`.)
2. Set these environment variables in the Render dashboard:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | the Atlas string from Step 1 |
   | `JWT_ACCESS_SECRET` | first secret from Step 2 |
   | `JWT_REFRESH_SECRET` | second secret from Step 2 |
   | `CLIENT_URL` | `https://<your-app>.vercel.app` — from Step 5; set it after |
   | `NODE_ENV` | `production` |

3. Deploy, then confirm: `https://<your-api>.onrender.com/api/health`
   should return `"status":"ok"` and `"database":{"status":"connected"}`.

4. Seed the 17 default categories, once, from the Render **Shell** tab:
   ```bash
   npm run seed --workspace server
   ```
   Without this, new users have no categories and cannot record anything.

> **Free tier caveat:** Render spins the service down after ~15 minutes idle.
> The next request takes 30–50 seconds to wake it. That is a cold start, not a
> bug — the first login after a quiet period will feel slow.

## Step 5 — Deploy the client to Vercel

```bash
vercel login
cd client
vercel --prod
```

Or via the dashboard: **New Project** → import the repo → set **Root Directory**
to `client`. `client/vercel.json` supplies the build and rewrite settings.

Set one environment variable in Vercel:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-api>.onrender.com/api` |

Vite inlines `VITE_*` variables **at build time**, so changing this needs a
redeploy, not just a restart.

## Step 6 — Close the CORS loop

Go back to Render and set `CLIENT_URL` to the Vercel URL, then redeploy.

This is the step people miss, and it is the one thing most likely to break the
deploy. The refresh token is an `httpOnly` cookie, so:

- the API must name the client origin exactly (no wildcard, because credentials)
- `CLIENT_URL` must be `https://` — the cookie is `Secure` and browsers drop it
  over plain HTTP
- production sets `SameSite=None` so the cookie survives the cross-origin hop

The server refuses to boot if `CLIENT_URL` is http or localhost while
`NODE_ENV=production`, so a misconfiguration fails loudly rather than
presenting a login that silently logs users straight back out.

---

## Verifying the deploy

1. `https://<api>/api/health` → `status: ok`, `database: connected`
2. Register a new account on the client
3. **Refresh the page** — you must stay logged in. If you are kicked to
   `/login`, the refresh cookie is not surviving: re-check Step 6.
4. Add an expense; create a group; add a split expense; open **Balances**

## If something breaks

| Symptom | Cause |
|---|---|
| Login works, refresh logs you out | `CLIENT_URL` wrong, or client is not on https |
| All API calls blocked by CORS | `CLIENT_URL` does not exactly match the client origin |
| `/dashboard` 404s on refresh | SPA rewrite missing — check `vercel.json` |
| Categories empty for new users | Seed script not run (Step 4.4) |
| Server exits at boot | Read the log; the env guard names the exact problem |
| First request after idle is slow | Render free-tier cold start |
