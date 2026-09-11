import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

/**
 * Animate a number up to its target on a requestAnimationFrame loop.
 *
 * Built for money, which constrains it in two ways. Every intermediate value is
 * rounded to a whole integer, because these are paise (D1) and a fractional
 * paisa has no meaning — and the final frame lands on the target exactly rather
 * than approaching it, so the figure the user reads is never a rounding error
 * away from the real balance.
 *
 * Re-targets from wherever it currently is, so switching month animates from
 * the previous month's figure instead of snapping to zero first.
 */
export function useCountUp(target, { duration = 900 } = {}) {
  const prefersReduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  const isAnimatable = typeof target === 'number' && Number.isFinite(target);

  useEffect(() => {
    if (prefersReduced || !isAnimatable) return undefined;

    let frame = 0;
    const startedAt = performance.now();
    const from = fromRef.current;
    const delta = target - from;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // easeOutCubic: most of the distance early, so the number settles rather
      // than creeping — which reads as "loaded" instead of "still loading".
      const eased = 1 - (1 - progress) ** 3;

      setValue(Math.round(from + delta * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);

    /*
     * Safety net. requestAnimationFrame does not run in a background tab and is
     * throttled under load, so an interrupted animation would leave a partly
     * counted figure on screen — and on a finance dashboard a number that is
     * merely *on its way* to the balance is indistinguishable from the balance.
     * A timer guarantees the true value lands whether or not a frame ever runs.
     */
    const settle = setTimeout(() => {
      fromRef.current = target;
      setValue(target);
    }, duration + 120);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [target, duration, prefersReduced, isAnimatable]);

  // Reduced motion, or a non-numeric value: hand back the truth untouched.
  if (prefersReduced || !isAnimatable) return target;
  return value;
}

export default useCountUp;
