import { useCountUp } from '../../hooks/useCountUp.js';
import { formatMoney } from '../../utils/money.js';

/**
 * A money figure that counts up to its value.
 *
 * The formatting still goes through formatMoney, so the animated figure and the
 * settled one are produced by exactly the same code path — there is no second,
 * slightly-different money formatter living in the animation layer.
 */
export default function CountUpMoney({ value, duration, className = '' }) {
  const animated = useCountUp(value ?? 0, duration ? { duration } : undefined);

  return (
    // aria-live is deliberately absent: a figure ticking through 60 values
    // would be announced 60 times. Screen readers get the settled number when
    // they reach it, which is the only one that means anything.
    <span className={`tabular ${className}`}>{formatMoney(animated)}</span>
  );
}
