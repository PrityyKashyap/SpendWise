/**
 * Date formatting for date-only values.
 *
 * The API stores a transaction's date as UTC midnight of the chosen calendar
 * day, so every format here reads it back in UTC. Formatting in local time
 * would shift the displayed day for anyone behind UTC — the exact bug the
 * storage rule exists to prevent (ARCHITECTURE.md appendix #9).
 */

/** ISO timestamp → 'YYYY-MM-DD', for date inputs. */
export function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

/** Today as 'YYYY-MM-DD' in UTC — the default for a new transaction. */
export function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

/** '8 September 2026' */
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** 'Today', 'Yesterday', or '8 Sep' — for grouping headers in a list. */
export function formatRelativeDay(value) {
  const date = new Date(value).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  if (date === today) return 'Today';
  if (date === yesterday) return 'Yesterday';

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: new Date(value).getUTCFullYear() === new Date().getUTCFullYear() ? undefined : 'numeric',
    timeZone: 'UTC',
  });
}

/** 'September 2026' from 'YYYY-MM'. */
export function formatMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The current month as 'YYYY-MM'. */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Shift a 'YYYY-MM' string by N months. */
export function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return shifted.toISOString().slice(0, 7);
}

/** Group transactions into [{ date, items }] preserving order. */
export function groupByDate(transactions) {
  const groups = new Map();
  for (const item of transactions) {
    const key = new Date(item.date).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

/** 'Sep' from 'YYYY-MM' — compact axis labels. */
export function formatMonthShort(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    timeZone: 'UTC',
  });
}
