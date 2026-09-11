import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

/**
 * A standing notice while the browser reports no connection.
 *
 * Worded as "some features may be unavailable", not "you are offline, changes
 * will sync later" — nothing here queues writes, and promising a sync that does
 * not exist is the one thing a finance app must never do.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2
                 border-b border-i-owe/25 bg-i-owe/10 px-4 py-2 text-xs font-medium
                 text-ink backdrop-blur-xl
                 supports-[padding:max(0px)]:pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-i-owe" aria-hidden="true" />
      You&apos;re offline. Some SpendWise features may be unavailable.
    </div>
  );
}
