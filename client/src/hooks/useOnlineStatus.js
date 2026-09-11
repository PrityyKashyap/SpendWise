import { useEffect, useState } from 'react';

/**
 * Whether the browser currently believes it has a network connection.
 *
 * `navigator.onLine` only reports whether a network interface is up — a captive
 * portal or a dead backend still reads as "online" — so this drives a warning
 * banner, never a decision about whether a request succeeded. What actually
 * happened to a transaction is decided by the API response and nothing else.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine !== false
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
