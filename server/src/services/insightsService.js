/**
 * Spending insights (IDEA.md §21).
 *
 * Every insight is arithmetic over the user's own transactions — no language
 * model. §21's four examples are all statistics:
 *
 *   "You spent 32% more on food this month than last month."
 *   "Shopping is currently your highest discretionary expense."
 *   "Your average daily spending increased compared with last month."
 *   "You may save approximately ₹2,000 by reducing entertainment expenses."
 *
 * A deterministic engine is the right tool: the figures are always correct, it
 * costs nothing per request, it works offline, and — the part that matters for
 * money — it cannot hallucinate a number about someone's finances. §21 also
 * says not to make unrealistic claims or pose as a financial adviser, which a
 * rules engine satisfies by construction.
 *
 * An LLM could later rephrase these into friendlier prose, but the numbers
 * should always come from here.
 */
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { monthRange, currentMonth } from '../utils/date.js';
import { percentChange, daysElapsedIn, averagePaise } from '../utils/analytics.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

/** Categories people can realistically cut, as opposed to rent or bills. */
const DISCRETIONARY = new Set([
  'Shopping',
  'Entertainment',
  'Food',
  'Travel',
  'Subscriptions',
]);

/** Below this, a percentage swing is noise rather than a trend. */
const MIN_MEANINGFUL_PAISE = 10000; // ₹100

function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7);
}

function formatPaise(paise) {
  return `₹${Math.round(Math.abs(paise) / 100).toLocaleString('en-IN')}`;
}

/** Spend per category for a month, plus the month's total. */
async function categorySpend(userId, month) {
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, categoryId: '$_id', name: '$category.name', color: '$category.color', icon: '$category.icon', total: 1 } },
    { $sort: { total: -1 } },
  ]);

  return { rows, total: rows.reduce((sum, r) => sum + r.total, 0) };
}

/**
 * Generate insights for a month, most useful first.
 *
 * Each rule returns null when it has nothing worth saying. An insight list
 * padded with filler ("you spent money this month") trains people to ignore
 * the panel entirely, so silence is preferred to noise.
 */
export async function getInsights(userId, month = currentMonth()) {
  const previousMonth = shiftMonth(month, -1);

  const [current, previous, budgets] = await Promise.all([
    categorySpend(userId, month),
    categorySpend(userId, previousMonth),
    Budget.find({ userId, isActive: true }).populate('categoryId', 'name').lean(),
  ]);

  const previousByCategory = new Map(previous.rows.map((r) => [String(r.categoryId), r.total]));

  const insights = [
    ...categoryChangeInsights(current, previousByCategory),
    topDiscretionaryInsight(current),
    dailyAverageInsight(month, previousMonth, current.total, previous.total),
    savingSuggestionInsight(current, previousByCategory),
    ...budgetInsights(budgets, current),
  ].filter(Boolean);

  return {
    month,
    previousMonth,
    hasEnoughData: current.total > 0,
    insights: insights.slice(0, 6),
  };
}

/** "You spent 32% more on food this month than last month." */
function categoryChangeInsights(current, previousByCategory) {
  return current.rows
    .map((row) => {
      const before = previousByCategory.get(String(row.categoryId)) ?? 0;

      // Needs a real previous figure and a meaningful amount, or the
      // percentage is arithmetically true but practically noise.
      if (before < MIN_MEANINGFUL_PAISE || row.total < MIN_MEANINGFUL_PAISE) return null;

      const change = percentChange(row.total, before);
      if (change === null || Math.abs(change) < 15) return null;

      const direction = change > 0 ? 'more' : 'less';
      return {
        id: `category-change-${row.categoryId}`,
        type: change > 0 ? 'warning' : 'positive',
        title: `${row.name} is ${direction === 'more' ? 'up' : 'down'} ${Math.abs(change)}%`,
        text:
          `You spent ${Math.abs(change)}% ${direction} on ${row.name} this month ` +
          `than last month (${formatPaise(row.total)} vs ${formatPaise(before)}).`,
        value: row.total,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
}

/** "Shopping is currently your highest discretionary expense." */
function topDiscretionaryInsight({ rows, total }) {
  const top = rows.find((row) => DISCRETIONARY.has(row.name));
  if (!top || total === 0 || top.total < MIN_MEANINGFUL_PAISE) return null;

  const share = Math.round((top.total / total) * 100);

  return {
    id: 'top-discretionary',
    type: 'neutral',
    title: `${top.name} is your biggest flexible expense`,
    text:
      `${top.name} is currently your highest discretionary expense at ` +
      `${formatPaise(top.total)} — ${share}% of everything you spent this month.`,
    value: top.total,
  };
}

/** "Your average daily spending increased compared with last month." */
function dailyAverageInsight(month, previousMonth, currentTotal, previousTotal) {
  const currentAvg = averagePaise(currentTotal, daysElapsedIn(month));
  const previousAvg = averagePaise(previousTotal, daysElapsedIn(previousMonth));

  if (previousAvg < MIN_MEANINGFUL_PAISE / 10 || currentAvg === 0) return null;

  const change = percentChange(currentAvg, previousAvg);
  if (change === null || Math.abs(change) < 10) return null;

  const increased = change > 0;
  return {
    id: 'daily-average',
    type: increased ? 'warning' : 'positive',
    title: `Daily spending ${increased ? 'up' : 'down'} ${Math.abs(change)}%`,
    text:
      `Your average daily spending ${increased ? 'increased' : 'decreased'} compared with ` +
      `last month — ${formatPaise(currentAvg)} a day versus ${formatPaise(previousAvg)}.`,
    value: currentAvg,
  };
}

/**
 * "You may save approximately ₹2,000 by reducing entertainment expenses."
 *
 * Grounded in the user's own past behaviour: the suggestion is to return to
 * what they themselves spent last month, not an invented target. §21 warns
 * against unrealistic claims, so "approximately" and the explicit comparison
 * are doing deliberate work here.
 */
function savingSuggestionInsight({ rows }, previousByCategory) {
  const candidates = rows
    .filter((row) => DISCRETIONARY.has(row.name))
    .map((row) => {
      const before = previousByCategory.get(String(row.categoryId)) ?? 0;
      return { ...row, before, excess: row.total - before };
    })
    .filter((row) => row.before > 0 && row.excess >= MIN_MEANINGFUL_PAISE);

  if (candidates.length === 0) return null;

  const biggest = candidates.reduce((max, row) => (row.excess > max.excess ? row : max));

  return {
    id: 'saving-suggestion',
    type: 'suggestion',
    title: `Around ${formatPaise(biggest.excess)} of possible savings`,
    text:
      `You may save approximately ${formatPaise(biggest.excess)} by bringing ${biggest.name} ` +
      `back to last month's level (${formatPaise(biggest.before)}).`,
    value: biggest.excess,
  };
}

/** Budgets that are already blown, surfaced alongside the other insights. */
function budgetInsights(budgets, current) {
  const spentByCategory = new Map(current.rows.map((r) => [String(r.categoryId), r.total]));

  return budgets
    .map((budget) => {
      const spent = spentByCategory.get(String(budget.categoryId?._id)) ?? 0;
      if (spent <= budget.amount) return null;

      return {
        id: `budget-${budget._id}`,
        type: 'warning',
        title: `${budget.categoryId.name} budget exceeded`,
        text:
          `⚠️ You have exceeded your ${budget.categoryId.name} budget by ` +
          `${formatPaise(spent - budget.amount)}.`,
        value: spent - budget.amount,
      };
    })
    .filter(Boolean)
    .slice(0, 2);
}
