import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether the user has asked the system to reduce motion.
 *
 * CSS handles most of this already, but a few effects here are driven by
 * JavaScript — a number counting up, a card tilting under the pointer — and CSS
 * cannot switch those off. Reading the preference lets those paths skip the
 * animation entirely rather than animate invisibly.
 *
 * Subscribed rather than read once: people change this setting mid-session,
 * often precisely because something on screen is making them unwell.
 */
export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true
  );

  useEffect(() => {
    const query = window.matchMedia?.(QUERY);
    if (!query) return undefined;

    const onChange = (event) => setPrefersReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}

export default usePrefersReducedMotion;
