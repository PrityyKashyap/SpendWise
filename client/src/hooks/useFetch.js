import { useCallback, useEffect, useState } from 'react';

/**
 * Fetch-on-mount with the loading/error/data states every screen needs
 * (ARCHITECTURE.md §4.5).
 *
 * `deps` controls refetching: pass the filters a request depends on and the
 * hook re-runs when they change.
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await run());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [run]);

  useEffect(() => {
    // A stale response from a superseded request must not overwrite a newer
    // one — without this guard, typing quickly in a search box can leave the
    // list showing results for an earlier keystroke.
    let cancelled = false;

    setIsLoading(true);
    (async () => {
      try {
        const result = await run();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [run]);

  return { data, error, isLoading, refetch: load };
}

export default useFetch;
