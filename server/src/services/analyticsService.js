/**
 * Analytics and monthly reports (IDEA.md §19, §22).
 *
 * Two rules shape everything here:
 *
 * 1. Series must be GAP-FREE. Aggregation only returns months and days that
 *    have transactions, but a chart plotted from sparse data draws a straight
 *    line across a month with no spending as though spending were steady. Every
 *    series below is padded with explicit zeros.
 *
 * 2. Dates are grouped in UTC, matching how they are stored (UTC midnight of
 *    the chosen calendar day). Grouping in server-local time would file some
 *    transactions under the wrong day.
 */
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { monthRange, currentMonth } from '../utils/date.js';
import {
  percentChange,
  daysInMonth,
  daysElapsedIn,
  averagePaise,
} from '../utils/analytics.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

/** Step a 'YYYY-MM' string by N months. */
function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7);
}

/**
 * Income, expenses and savings per month, for the trend charts (IDEA.md §8).
 *
 * @param {number} months how many months back to include, ending with `endMonth`
 */
export async function getMonthlyTrends(userId, { months = 6, endMonth = currentMonth() } = {}) {
  const startMonth = shiftMonth(endMonth, -(months - 1));
  const start = monthRange(startMonth).start;
  const end = monthRange(endMonth).end;

  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        // timezone defaults to UTC, which matches how dates are stored.
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Index the sparse results so the padded series can look each month up.
  const byMonth = new Map();
  for (const row of rows) {
    const entry = byMonth.get(row._id.month) ?? { income: 0, expense: 0 };
    entry[row._id.type] = row.total;
    byMonth.set(row._id.month, entry);
  }

  const series = [];
  for (let i = 0; i < months; i += 1) {
    const month = shiftMonth(startMonth, i);
    const { income = 0, expense = 0 } = byMonth.get(month) ?? {};
    series.push({
      month,
      income,
      expense,
      // Savings is what is left, and it can legitimately be negative — a month
      // where you spent more than you earned is real information, not an error
      // to clamp to zero.
      savings: income - expense,
    });
  }

  return { months, series };
}

/**
 * Money in, out and net for each day of a month (IDEA.md §22).
 *
 * The chronological list form of the money timeline is already the
 * Transactions page; what it cannot show is whether a given day left you up or
 * down, which is what `net` here provides.
 */
export async function getDailyFlow(userId, month = currentMonth()) {
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    { $match: { userId: oid(userId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const byDay = new Map();
  for (const row of rows) {
    const entry = byDay.get(row._id.day) ?? { income: 0, expense: 0 };
    entry[row._id.type] = row.total;
    byDay.set(row._id.day, entry);
  }

  // Every day of the month, including empty ones — a bar chart with missing
  // days silently compresses the x-axis and misrepresents the pattern.
  const days = [];
  let runningBalance = 0;
  for (let day = 1; day <= daysInMonth(month); day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const { income = 0, expense = 0 } = byDay.get(date) ?? {};
    runningBalance += income - expense;
    days.push({ date, day, income, expense, net: income - expense, runningBalance });
  }

  const totalExpense = days.reduce((sum, d) => sum + d.expense, 0);
  const busiest = days.reduce((max, d) => (d.expense > max.expense ? d : max), days[0]);

  return {
    month,
    days,
    totalIncome: days.reduce((sum, d) => sum + d.income, 0),
    totalExpense,
    // Only meaningful if something was actually spent.
    highestSpendingDay: busiest?.expense > 0 ? busiest : null,
  };
}

/** Totals and the top category for one month. Used twice by the report. */
async function monthFacts(userId, month) {
  const { start, end } = monthRange(month);

  const [totals, topCategory] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: oid(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: oid(userId), type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      {
        $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          total: 1,
        },
      },
    ]),
  ]);

  const facts = { income: 0, expense: 0, transactionCount: 0 };
  for (const row of totals) {
    facts[row._id] = row.total;
    facts.transactionCount += row.count;
  }

  return {
    ...facts,
    savings: facts.income - facts.expense,
    topCategory: topCategory[0] ?? null,
  };
}

/**
 * The monthly report (IDEA.md §19).
 *
 * Includes a like-for-like comparison with the previous month. Where the
 * previous month has no data the change is null rather than a fabricated
 * percentage.
 */
export async function getMonthlyReport(userId, month = currentMonth()) {
  const previousMonth = shiftMonth(month, -1);

  const [current, previous] = await Promise.all([
    monthFacts(userId, month),
    monthFacts(userId, previousMonth),
  ]);

  // For an in-progress month, average over days elapsed rather than the full
  // month length — see utils/analytics.js.
  const days = daysElapsedIn(month);
  const previousDays = daysElapsedIn(previousMonth);

  return {
    month,
    previousMonth,
    isPartialMonth: month === currentMonth(),
    daysCounted: days,

    totalIncome: current.income,
    totalExpenses: current.expense,
    savings: current.savings,
    transactionCount: current.transactionCount,

    // Savings rate: the share of income kept. Undefined without income, so
    // null rather than a divide-by-zero.
    savingsRate:
      current.income > 0 ? Math.round((current.savings / current.income) * 1000) / 10 : null,

    averageDailySpend: averagePaise(current.expense, days),
    topCategory: current.topCategory,

    comparison: {
      previous: {
        totalIncome: previous.income,
        totalExpenses: previous.expense,
        savings: previous.savings,
        averageDailySpend: averagePaise(previous.expense, previousDays),
      },
      incomeChange: percentChange(current.income, previous.income),
      expenseChange: percentChange(current.expense, previous.expense),
      savingsChange: percentChange(current.savings, previous.savings),
      // True when the previous month has nothing to compare against, so the UI
      // can explain the missing percentages instead of showing blanks.
      hasPreviousData: previous.transactionCount > 0,
    },
  };
}
