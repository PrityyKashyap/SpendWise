#!/usr/bin/env bash
#
# Pre-deployment readiness check.
#
# Verifies everything checkable locally, so a bad deploy fails here — where the
# feedback loop is seconds — instead of after a push.
#
#   bash scripts/predeploy-check.sh
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0; FAIL=0; WARN=0
ok(){   printf "  ✅ %s\n" "$1"; PASS=$((PASS+1)); }
bad(){  printf "  ❌ %s\n" "$1"; FAIL=$((FAIL+1)); }
warn(){ printf "  ⚠️  %s\n" "$1"; WARN=$((WARN+1)); }

echo "═══ SpendWise pre-deploy check ═══"
echo
echo "── Secrets ──"
if git check-ignore -q server/.env 2>/dev/null; then ok "server/.env is gitignored"
else bad "server/.env is NOT gitignored"; fi
if git ls-files --error-unmatch server/.env >/dev/null 2>&1; then
  bad "server/.env is TRACKED by git — run: git rm --cached server/.env"
else ok "server/.env is not tracked by git"; fi
if grep -rqE "JWT_(ACCESS|REFRESH)_SECRET|mongodb\+srv://" client/src 2>/dev/null; then
  bad "a secret or connection string appears in client/src"
else ok "no secrets in client source"; fi

echo
echo "── Env templates ──"
[ -f server/.env.example ] && ok "server/.env.example" || bad "server/.env.example missing"
[ -f client/.env.example ] && ok "client/.env.example" || bad "client/.env.example missing"

echo
echo "── Build ──"
if (cd client && npm run build >/tmp/predeploy-build.log 2>&1); then
  ok "client builds ($(du -sh client/dist 2>/dev/null | cut -f1 | tr -d ' '))"
else
  bad "client build FAILED — see /tmp/predeploy-build.log"
fi

echo
echo "── Lint ──"
if (cd client && npx oxlint src >/tmp/predeploy-lint.log 2>&1); then ok "client lint clean"
else warn "lint issues — see /tmp/predeploy-lint.log"; fi

echo
echo "── Server ──"
if (cd server && node -e "import('./src/app.js').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})" >/tmp/predeploy-app.log 2>&1); then
  ok "server app module loads"
else
  bad "server failed to load — see /tmp/predeploy-app.log"
fi
grep -q '"start"' server/package.json && ok "server start script present" || bad "server needs a start script"

echo
echo "── SPA routing ──"
[ -f client/vercel.json ] && ok "vercel.json rewrites present" || warn "no vercel.json — /dashboard would 404 on refresh"
[ -f client/public/_redirects ] && ok "_redirects present (Netlify)" || warn "no _redirects (Netlify only)"

echo
echo "── Production guards ──"
grep -q "isProduction" server/src/config/env.js && ok "env guards reject localhost DB / http client URL" || bad "no production env guards"
grep -q "trust proxy" server/src/app.js && ok "trust proxy set" || bad "trust proxy NOT set — rate limiting would bucket all users together"
[ -f server/render.yaml ] && ok "render.yaml blueprint" || warn "no render.yaml"

echo
echo "── Set these on the host (cannot be checked locally) ──"
warn "MONGO_URI      — MongoDB Atlas connection string"
warn "JWT_ACCESS_SECRET + JWT_REFRESH_SECRET — two different 32+ char values"
warn "CLIENT_URL     — https:// origin of the deployed client"
warn "VITE_API_URL   — deployed API origin + /api (set on the client host)"

echo
echo "═══ $PASS passed · $FAIL failed · $WARN to action ═══"
if [ "$FAIL" -eq 0 ]; then echo "Ready to deploy once the four variables above are set."; else echo "Fix the failures first."; fi
exit "$FAIL"
