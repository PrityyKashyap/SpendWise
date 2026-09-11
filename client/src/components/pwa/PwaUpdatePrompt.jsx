import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the service worker and offers an update when a new build lands.
 *
 * The service worker is configured with skipWaiting: false, so a new version
 * sits waiting until this prompt is accepted. That ordering is deliberate: an
 * automatic reload mid-session would discard a half-entered transaction and
 * interrupt whatever the user was doing, which on a finance app is worse than
 * running a build that is ten minutes old.
 *
 * Accepting calls updateServiceWorker(true), which activates the waiting worker
 * and reloads. The session survives it — the access token is re-obtained from
 * the httpOnly refresh cookie on boot, exactly as on any other page load.
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="anim-rise fixed inset-x-3 bottom-3 z-[58] mx-auto flex max-w-md items-center
                 gap-3 rounded-2xl border border-line/80 bg-surface/85 p-3 pl-4
                 shadow-xl shadow-brand-deep/10 backdrop-blur-2xl
                 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <RefreshCw className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />

      <p className="min-w-0 flex-1 text-sm text-ink">
        A new version of SpendWise is ready.
      </p>

      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white
                   transition active:scale-95 focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Update
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted
                   transition hover:text-ink focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Later
      </button>
    </div>
  );
}
