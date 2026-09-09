/**
 * Dashboard aggregations (ARCHITECTURE.md §3.8).
 *
 * IMPORTANT — the D5 rule this file exists to honour:
 *
 *   Your personal expense total is NOT the sum of every bill you paid. If you
 *   pay ₹8,000 for a group of four, only your ₹2,000 share is your expense;
 *   the other ₹6,000 is money owed back to you. Counting the full ₹8,000 would
 *   double-count it against "others owe me" and understate your balance.
 *
 * So `totalExpenses` is deliberately assembled from named parts:
 *
 *   totalExpenses = personalExpenses + myShareOfGroupExpenses
 *
 * Phase 3 has no groups, so the second term is zero and is stated explicitly
 * rather than omitted, so the arithmetic reads correctly from the start.
 */
import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { GroupExpense } from '../models/GroupExpense.js';
import { Settlement } from '../models/Settlement.js';
import { computeBalances, balanceForMember } from './balanceService.js';
import { Transaction } from '../models/Transaction.js';
import { monthRange, currentMonth } from '../utils/date.js';

/** Sum transactions by type over a date range. */
async function sumByType(userId, { start, end }) {
  const rows = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const totals = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
  for (const row of rows) {
    totals[row._id] = row.total;
    totals[`${row._id}Count`] = row.count;
  }
  return totals;
}

/**
 * The member ids that represent this user across all their groups.
 *
 * A user is a different member row in each group (ARCHITECTURE.md D3), so
 * "my share" means "the share of any member row linked to my account".
 */
async function myMemberships(userId) {
  const groups = await Group.find({ 'members.userId': userId, isArchived: false })
    .select('members')
    .lean();

  const memberIds = [];
  for (const group of groups) {
    for (const member of group.members) {
      if (member.userId && String(member.userId) === String(userId)) {
        memberIds.push(member._id);
      }
    }
  }
  return memberIds;
}

/**
 * My share of group expenses over a range — the second term in D5.
 *
 * Paying an ₹8,000 group bill for four people is NOT ₹8,000 of personal
 * expense: ₹6,000 of it is a receivable. My actual spending is my ₹2,000
 * share, which is what this returns. Writing the full amount as a Transaction
 * instead would double-count it against "others owe me" and understate the
 * balance by ₹6,000.
 */
async function sumMyGroupExpenseShare(userId, range) {
  const memberIds = await myMemberships(userId);
  if (memberIds.length === 0) return 0;

  const rows = await GroupExpense.aggregate([
    { $match: { date: { $gte: range.start, $lte: range.end } } },
    { $unwind: '$participants' },
    { $match: { 'participants.memberId': { $in: memberIds } } },
    { $group: { _id: null, total: { $sum: '$participants.share' } } },
  ]);

  return rows[0]?.total ?? 0;
}

/**
 * Outstanding debts across every group, in both directions (IDEA.md §8).
 *
 * Computed from the same balance engine the group screens use, so the
 * dashboard figure and the group figure cannot disagree.
 *
 * Deliberately NOT restricted to a month: a debt from August is still owed in
 * September. Filtering it by the selected month would make outstanding money
 * silently vanish when the month rolls over.
 */
async function sumOutstandingDebts(userId) {
  const groups = await Group.find({ 'members.userId': userId, isArchived: false }).lean();
  if (groups.length === 0) return { othersOweMe: 0, iOweOthers: 0 };

  const groupIds = groups.map((g) => g._id);
  const [expenses, settlements] = await Promise.all([
    GroupExpense.find({ groupId: { $in: groupIds } }).lean(),
    Settlement.find({ groupId: { $in: groupIds } }).lean(),
  ]);

  const byGroup = (docs) => {
    const map = new Map();
    for (const doc of docs) {
      const key = String(doc.groupId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(doc);
    }
    return map;
  };

  const expensesByGroup = byGroup(expenses);
  const settlementsByGroup = byGroup(settlements);

  let othersOweMe = 0;
  let iOweOthers = 0;

  for (const group of groups) {
    const me = group.members.find((m) => m.userId && String(m.userId) === String(userId));
    if (!me) continue;

    const balances = computeBalances(
      group,
      expensesByGroup.get(String(group._id)) ?? [],
      settlementsByGroup.get(String(group._id)) ?? []
    );

    const mine = balanceForMember(balances, me._id);
    othersOweMe += mine.owedToMe;
    iOweOthers += mine.iOwe;
  }

  return { othersOweMe, iOweOthers };
}

/**
 * The five headline figures from IDEA.md §8.
 *
 * @param {string} userId
 * @param {string} [month] 'YYYY-MM', defaults to the current month
 */
export async function getSummary(userId, month = currentMonth()) {
  const range = monthRange(month);

  const [totals, groupShare, debts] = await Promise.all([
    sumByType(userId, range),
    sumMyGroupExpenseShare(userId, range),
    sumOutstandingDebts(userId),
  ]);

  const totalIncome = totals.income;
  const totalExpenses = totals.expense + groupShare;

  return {
    month,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    othersOweMe: debts.othersOweMe,
    iOweOthers: debts.iOweOthers,

    // Broken out so the UI can explain the total rather than just assert it.
    breakdown: {
      personalExpenses: totals.expense,
      groupExpenseShare: groupShare,
      transactionCount: totals.incomeCount + totals.expenseCount,
    },
  };
}

/**
 * Spending by category for the pie chart (IDEA.md §8).
 *
 * Expenses only — mixing income into a "where did my money go" chart makes it
 * unreadable.
 */
export async function getSpendingByCategory(userId, month = currentMonth()) {
  const { start, end } = monthRange(month);

  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
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
        count: 1,
      },
    },
  ]);

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return {
    month,
    total,
    // Percentage is computed here rather than in the chart so the number in
    // the legend and the slice always agree.
    categories: rows.map((row) => ({
      ...row,
      percentage: total === 0 ? 0 : Math.round((row.total / total) * 1000) / 10,
    })),
  };
}

/** Most recent transactions for the dashboard list. */
export async function getRecentTransactions(userId, limit = 5) {
  const rows = await Transaction.find({ userId })
    .sort({ date: -1, _id: -1 })
    .limit(limit)
    .populate({ path: 'categoryId', select: 'name icon color type' })
    .lean();

  return rows.map(({ categoryId, ...rest }) => ({
    ...rest,
    category: categoryId,
    source: 'personal',
  }));
}
