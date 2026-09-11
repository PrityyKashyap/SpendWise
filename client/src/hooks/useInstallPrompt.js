import { useCallback, useEffect, useState } from 'react';

const DISMISSED_KEY = 'spendwise:install-dismissed';
// A dismissal is respected for this long. Permanent would mean someone who
// taps "not now" once can never be offered it again, even months later on a
// device they now use daily.
const DISMISS_DAYS = 30;

function wasDismissedRecently() {
  try {
    const at = Number(window.localStorage.getItem(DISMISSED_KEY));
    if (!at) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode, or site data blocked. Treat as "not dismissed" rather than
    // letting a storage error suppress the prompt forever.
    return false;
  }
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS Safari predates display-mode and uses its own flag.
    window.navigator.standalone === true
  );
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so a Mac with touch points is an iPad.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Drives the "Add to Home Screen" offer.
 *
 * Two paths, because the platforms differ. Chromium fires `beforeinstallprompt`
 * and hands over an event we can trigger later. iOS Safari has no such API at
 * all — installing is a manual Share-sheet action — so there the only honest
 * thing to offer is instructions.
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
  const [isDismissed, setIsDismissed] = useState(wasDismissedRecently);

  const isIOS = detectIOS();

  useEffect(() => {
    const onBeforeInstall = (event) => {
      // Chromium would otherwise show its own mini-infobar; holding the event
      // lets the offer appear in the app's own design, at a sensible moment.
      event.preventDefault();
      setDeferredEvent(event);
    };
    const onInstalled = () => {
      setDeferredEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage unavailable: the prompt stays hidden for this session only.
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return false;
    deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    // The event is single-use; Chromium fires a fresh one if it still applies.
    setDeferredEvent(null);
    if (outcome === 'dismissed') dismiss();
    return outcome === 'accepted';
  }, [deferredEvent, dismiss]);

  return {
    /** Chromium only: a real install can be triggered. */
    canInstall: Boolean(deferredEvent) && !isStandalone && !isDismissed,
    /** iOS: no API, so show the Share-sheet instructions instead. */
    showIOSHint: isIOS && !isStandalone && !isDismissed,
    isStandalone,
    promptInstall,
    dismiss,
  };
}

export default useInstallPrompt;
