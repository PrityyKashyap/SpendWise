import { useEffect, useState } from 'react';
import { Share, Plus, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js';

/** Wait before offering. Interrupting someone's first seconds is what makes
 *  install banners feel like adware. */
const APPEAR_AFTER_MS = 6000;

/**
 * A single, dismissible offer to install the app.
 *
 * Never shown when already installed, and a dismissal is remembered for a month
 * (useInstallPrompt.js), so it cannot become the banner that reappears on every
 * visit.
 */
export default function InstallPrompt() {
  const { canInstall, showIOSHint, promptInstall, dismiss } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!canInstall && !showIOSHint) return undefined;
    const timer = setTimeout(() => setIsVisible(true), APPEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, [canInstall, showIOSHint]);

  if (!isVisible || (!canInstall && !showIOSHint)) return null;

  return (
    <div
      className="anim-rise fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-md rounded-2xl
                 border border-line/80 bg-surface/80 p-4 shadow-xl shadow-brand-deep/10
                 backdrop-blur-2xl sm:bottom-5
                 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
      role="dialog"
      aria-label="Install SpendWise"
    >
      <div className="flex items-start gap-3">
        <img
          src="/pwa-192x192.png"
          alt=""
          width="40"
          height="40"
          className="h-10 w-10 shrink-0 rounded-xl"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Get the full SpendWise experience</p>

          {canInstall ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Install it for faster access and a full-screen, app-like view.
              </p>
              <button
                type="button"
                onClick={promptInstall}
                className="mt-3 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold
                           text-white transition active:scale-[0.98]
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-brand"
              >
                Add to Home Screen
              </button>
            </>
          ) : (
            // iOS has no install API — the user has to do it from the Share
            // sheet, so the only useful thing to show is where the buttons are.
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-ink-muted">
              Tap
              <Share className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              <span className="font-medium text-ink">Share</span>
              <span aria-hidden="true">→</span>
              <Plus className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              <span className="font-medium text-ink">Add to Home Screen</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg
                     text-ink-muted transition hover:bg-canvas hover:text-ink
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
