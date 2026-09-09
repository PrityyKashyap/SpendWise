import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copy text to the clipboard, with honest failure.
 *
 * `navigator.clipboard` is unavailable in insecure contexts and can be denied
 * by permissions, so the legacy `execCommand` path is a real fallback rather
 * than decoration. If both fail the hook reports it, because silently
 * pretending to copy would leave the user pasting stale content.
 */
export function useClipboard({ resetAfter = 2000 } = {}) {
  const [status, setStatus] = useState('idle'); // idle | copied | failed
  const timerRef = useRef(null);

  // Clear on unmount so setState never runs on an unmounted component.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback(
    async (text) => {
      let ok = false;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }

      if (!ok) {
        // Fallback: a hidden textarea plus execCommand. Deprecated, but it is
        // the only option on http:// origins and older browsers.
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          ok = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch {
          ok = false;
        }
      }

      setStatus(ok ? 'copied' : 'failed');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStatus('idle'), resetAfter);

      return ok;
    },
    [resetAfter]
  );

  return { copy, status };
}

export default useClipboard;
