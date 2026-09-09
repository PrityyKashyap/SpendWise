/**
 * Date helpers for date-only fields.
 *
 * A transaction's date is a calendar day, not an instant. Storing it as a
 * local-time Date makes "which day was this?" depend on the reader's timezone:
 * an expense recorded at 00:30 IST would be stored as 19:00 UTC the previous
 * day and shown as the wrong date to a UTC reader.
 *
 * So: parse 'YYYY-MM-DD' to UTC midnight, and format back in UTC. The day the
 * user picks is the day everyone sees (ARCHITECTURE.md appendix #9).
 */

/** 'YYYY-MM-DD' → Date at UTC midnight. */
export function parseCalendarDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date → 'YYYY-MM-DD' in UTC. */
export function toCalendarDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Inclusive UTC range covering the given calendar days.
 *
 * `to` is pushed to the END of that day, so `to=2026-09-08` includes
 * transactions dated the 8th rather than excluding them by an instant.
 */
export function calendarRange({ from, to }) {
  const range = {};
  if (from) range.$gte = parseCalendarDate(from);
  if (to) range.$lte = new Date(`${to}T23:59:59.999Z`);
  return Object.keys(range).length ? range : null;
}

/** First and last instant of a month, in UTC. `monthRange('2026-09')` */
export function monthRange(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

/** The current month as 'YYYY-MM' in UTC. */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
