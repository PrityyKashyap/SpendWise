import { useEffect, useState } from 'react';
import { getHealth } from '../services/healthService.js';
import { formatMoney } from '../utils/money.js';

/**
 * Phase 1 verification page.
 *
 * This is a real diagnostic screen, not a mock dashboard: it makes an actual
 * HTTP request through the real service layer to the real API, which reports
 * its real Mongoose connection state. If anything in the chain is broken —
 * server down, wrong port, CORS misconfigured, database unreachable — this
 * page says so specifically.
 *
 * It also demonstrates the four-state rule (ARCHITECTURE.md §4.5) that every
 * data-driven component in this app must follow: loading, error, empty, success.
 *
 * Phase 2 replaces this route with the real landing page.
 */
export default function SystemStatus() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch health. `isLoading` starts true, so the mount call need not set it. */
  async function load() {
    setError(null);
    try {
      setHealth(await getHealth());
    } catch (err) {
      setError(err);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }

  /** Manual re-check from the button: show the loading state again first. */
  function check() {
    setIsLoading(true);
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-lg">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full
                          bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            Phase 1 · Foundation
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">SpendWise</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Track → Analyze → Split → Settle → Remind
          </p>
        </header>

        <section
          className="rounded-2xl border border-line bg-surface p-6
                     shadow-sm shadow-slate-900/5"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">System status</h2>
            <button
              onClick={check}
              disabled={isLoading}
              className="rounded-lg border border-line px-3 py-1.5 text-xs
                         font-medium text-ink-muted transition hover:bg-canvas
                         disabled:opacity-50"
            >
              {isLoading ? 'Checking…' : 'Re-check'}
            </button>
          </div>

          {/* LOADING — skeletons shaped like the final content, so nothing
              shifts when the data lands. */}
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-canvas" />
              ))}
            </div>
          )}

          {/* ERROR — states what actually failed, and offers a way forward. */}
          {!isLoading && error && (
            <div className="rounded-lg border border-expense/20 bg-expense/5 p-4">
              <p className="text-sm font-medium text-expense">
                {error.code === 'NETWORK_ERROR' ? 'API unreachable' : 'Health check failed'}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{error.message}</p>
              <p className="mt-3 font-mono text-xs text-ink-muted">
                Start the API: cd server &amp;&amp; npm run dev
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {!isLoading && health && (
            <dl className="divide-y divide-line">
              <Row label="API" value={health.status} ok={health.status === 'ok'} />
              <Row
                label="Database"
                value={health.database.status}
                ok={health.database.status === 'connected'}
                detail={health.database.name}
              />
              <Row label="Environment" value={health.environment} muted />
              <Row label="Uptime" value={`${health.uptimeSeconds}s`} muted />
            </dl>
          )}
        </section>

        {/* Proves the integer-paise money layer (D1) renders correctly on the
            client. 800000 paise must display as ₹8,000.00 — the hotel bill
            from the IDEA.md §11 example. */}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Money layer check · 800000 paise ={' '}
          <span className="tabular font-medium text-ink">{formatMoney(800000)}</span>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, ok, detail, muted }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="flex items-center gap-2">
        {detail && <span className="text-xs text-ink-muted">{detail}</span>}
        {!muted && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-income' : 'bg-expense'}`}
            aria-hidden="true"
          />
        )}
        <span
          className={`text-sm font-medium ${
            muted ? 'text-ink-muted' : ok ? 'text-income' : 'text-expense'
          }`}
        >
          {value}
        </span>
      </dd>
    </div>
  );
}
