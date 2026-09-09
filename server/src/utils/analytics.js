/**
 * Small numeric helpers for analytics. Pure functions, easy to test.
 */

/**
 * Percent change from `previous` to `current`, rounded to one decimal.
 *
 * Returns null when there is no meaningful comparison — specifically when the
 * previous value is 0. (current − 0) / 0 is Infinity, and reporting that as
 * "100%" or "∞%" would be a fabricated statistic. A null tells the UI to say
 * "no data to compare" instead of inventing a number.
 */
export function percentChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Days in a 'YYYY-MM' month. */
export function daysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The number of days to divide by when computing a daily average.
 *
 * For a finished month this is simply its length. For the CURRENT month it is
 * the days elapsed so far: dividing this month's spending by 30 on the 9th
 * reports a third of the real daily rate, which makes the figure useless
 * exactly when a user most wants it.
 */
export function daysElapsedIn(yearMonth) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  if (yearMonth > currentMonth) return 0;        // a future month
  if (yearMonth < currentMonth) return daysInMonth(yearMonth);
  return now.getUTCDate();                        // in progress
}

/** Integer division that rounds to the nearest paisa. */
export function averagePaise(totalPaise, days) {
  if (!days) return 0;
  return Math.round(totalPaise / days);
}
