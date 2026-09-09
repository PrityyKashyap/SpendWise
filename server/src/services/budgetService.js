/**
 * Budgets (IDEA.md §20).
 *
 * Limits are stored; progress is derived. See models/Budget.js for why.
 */
import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { ApiError } from '../utils/ApiError.js';
import { monthRange, currentMonth } from '../utils/date.js';
import { daysInMonth, daysElapsedIn } from '../utils/analytics.js';

const oid = (id) => new mongoose.Types.ObjectId(id);

/** Confirm the category exists and this user may use it. */
async function assertUsableCategory(userId, categoryId) {
  const category = await Category.findOne({
    _id: categoryId,
    userId: { $in: [null, oid(userId)] },
    type: 'expense',
  }).lean();

  if (!category) {
    throw new ApiError(422, 'INVALID_CATEGORY', 'Choose one of your expense categories.', {
      categoryId: 'Not a valid expense category',
    });
  }
  return category;
}

export async function createBudget(userId, { categoryId, amount, warnAtPercent }) {
  await assertUsableCategory(userId, categoryId);

  const existing = await Budget.findOne({ userId, categoryId, period: 'monthly', isActive: true });
  if (existing) {
    throw new ApiError(409, 'BUDGET_EXISTS', 'You already have a budget for this category.', {
      categoryId: 'Budget already set',
    });
  }

  const budget = await Budget.create({
    userId,
    categoryId,
    amount,
    ...(warnAtPercent !== undefined ? { warnAtPercent } : {}),
  });

  return budget.toObject();
}

export async function updateBudget(userId, budgetId, data) {
  // Ownership is part of the filter, so another user's budget is simply not
  // found rather than found-then-rejected (ARCHITECTURE.md §5.6).
  const budget = await Budget.findOne({ _id: budgetId, userId });
  if (!budget) throw new ApiError(404, 'NOT_FOUND', 'Budget not found.');

  if (data.amount !== undefined) budget.amount = data.amount;
  if (data.warnAtPercent !== undefined) budget.warnAtPercent = data.warnAtPercent;
  if (data.isActive !== undefined) budget.isActive = data.isActive;

  await budget.save();
  return budget.toObject();
}

export async function deleteBudget(userId, budgetId) {
  const result = await Budget.deleteOne({ _id: budgetId, userId });
  if (result.deletedCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Budget not found.');
}

/**
 * Every budget with its progress for a month (IDEA.md §20).
 *
 * Returns the warning text alongside the numbers so the copy lives in one
 * place rather than being reassembled by each screen that shows a budget.
 */
export async function getBudgetProgress(userId, month = currentMonth()) {
  const budgets = await Budget.find({ userId, isActive: true })
    .populate('categoryId', 'name icon color')
    .lean();

  if (budgets.length === 0) {
    return { month, budgets: [], totals: { limit: 0, spent: 0, remaining: 0 } };
  }

  const { start, end } = monthRange(month);

  // One grouped aggregation for every budgeted category, rather than a query
  // per budget.
  const spendRows = await Transaction.aggregate([
    {
      $match: {
        userId: oid(userId),
        type: 'expense',
        date: { $gte: start, $lte: end },
        categoryId: { $in: budgets.map((b) => b.categoryId._id) },
      },
    },
    { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
  ]);

  const spentByCategory = new Map(spendRows.map((row) => [String(row._id), row.spent]));

  // For an in-progress month, "on track" has to account for how much of the
  // month has actually passed — spending 60% of a budget is fine on the 25th
  // and alarming on the 3rd.
  const elapsed = daysElapsedIn(month);
  const total = daysInMonth(month);
  const monthFraction = total > 0 ? elapsed / total : 1;

  const rows = budgets.map((budget) => {
    const spent = spentByCategory.get(String(budget.categoryId._id)) ?? 0;
    const remaining = budget.amount - spent;
    const percent = Math.round((spent / budget.amount) * 1000) / 10;

    // Pace: what fraction of the budget SHOULD be gone by now.
    const expectedByNow = budget.amount * monthFraction;
    const isAheadOfPace = spent > expectedByNow && percent < 100;

    let status = 'ok';
    if (spent > budget.amount) status = 'exceeded';
    else if (percent >= budget.warnAtPercent) status = 'warning';
    else if (isAheadOfPace) status = 'ahead_of_pace';

    return {
      _id: budget._id,
      category: {
        _id: budget.categoryId._id,
        name: budget.categoryId.name,
        icon: budget.categoryId.icon,
        color: budget.categoryId.color,
      },
      amount: budget.amount,
      warnAtPercent: budget.warnAtPercent,
      spent,
      remaining,
      percent,
      status,
      message: messageFor(status, budget.categoryId.name, remaining, percent),
    };
  });

  return {
    month,
    isPartialMonth: month === currentMonth(),
    budgets: rows.sort((a, b) => b.percent - a.percent),
    totals: {
      limit: rows.reduce((sum, r) => sum + r.amount, 0),
      spent: rows.reduce((sum, r) => sum + r.spent, 0),
      remaining: rows.reduce((sum, r) => sum + r.remaining, 0),
    },
  };
}

function formatPaise(paise) {
  return `₹${(Math.abs(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/** §20 asks for "⚠️ You have exceeded your Food budget." */
function messageFor(status, categoryName, remaining, percent) {
  switch (status) {
    case 'exceeded':
      return `⚠️ You have exceeded your ${categoryName} budget by ${formatPaise(remaining)}.`;
    case 'warning':
      return `You have used ${percent}% of your ${categoryName} budget — ${formatPaise(remaining)} left.`;
    case 'ahead_of_pace':
      return `You are spending faster than usual on ${categoryName} this month.`;
    default:
      return `${formatPaise(remaining)} left of your ${categoryName} budget.`;
  }
}
