/**
 * Group expense business logic (ARCHITECTURE.md §3.6).
 *
 * The split is resolved here, once, before anything is written — so every
 * reader downstream only ever adds up stored integers.
 */
import { GroupExpense } from '../models/GroupExpense.js';
import { ApiError } from '../utils/ApiError.js';
import { parseCalendarDate } from '../utils/date.js';
import { calculateSplits } from './splitService.js';

/**
 * Validate the people involved against the group's actual roster.
 *
 * Without this a client could attach a memberId from a different group, and
 * the resulting shares would be owed by someone who is not in the group —
 * quietly breaking the "balances sum to zero" invariant.
 */
function assertMembersBelong(group, { paidBy, participants }) {
  if (!group.hasMember(paidBy)) {
    throw new ApiError(422, 'PAYER_NOT_MEMBER', 'The payer is not a member of this group.', {
      paidBy: 'Choose a group member',
    });
  }

  for (const participant of participants) {
    if (!group.hasMember(participant.memberId)) {
      throw new ApiError(
        422,
        'INVALID_PARTICIPANTS',
        'One of the participants is not a member of this group.',
        { participants: 'Choose group members only' }
      );
    }
  }
}

/** Attach member names so the client can render without a second lookup. */
function present(expense, group) {
  const nameOf = (memberId) =>
    group.members.find((m) => String(m._id) === String(memberId))?.name ?? 'Removed member';

  const doc = expense.toObject ? expense.toObject() : expense;

  return {
    ...doc,
    paidByName: nameOf(doc.paidBy),
    participants: doc.participants.map((p) => ({ ...p, name: nameOf(p.memberId) })),
  };
}

/**
 * Resolve a split without saving.
 *
 * Backs the live preview in the split form, so the amounts a user sees while
 * typing are computed by exactly the same code that will store them — the
 * preview cannot disagree with the result.
 */
export function previewSplit(group, input) {
  assertMembersBelong(group, input);

  return calculateSplits({
    totalAmount: input.totalAmount,
    splitType: input.splitType,
    participants: input.participants,
    paidBy: input.paidBy,
  });
}

export async function createExpense(user, group, input) {
  const participants = previewSplit(group, input);

  const expense = await GroupExpense.create({
    groupId: group._id,
    description: input.description,
    totalAmount: input.totalAmount,
    currency: group.currency,
    paidBy: input.paidBy,
    splitType: input.splitType,
    participants,
    category: input.category ?? '',
    date: parseCalendarDate(input.date),
    notes: input.notes ?? '',
    createdBy: user._id,
  });

  return present(expense, group);
}

export async function listExpenses(group, { page = 1, limit = 20 } = {}) {
  const filter = { groupId: group._id };

  const [items, total] = await Promise.all([
    GroupExpense.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    GroupExpense.countDocuments(filter),
  ]);

  return {
    items: items.map((expense) => present(expense, group)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getExpense(group, expenseId) {
  const expense = await GroupExpense.findOne({ _id: expenseId, groupId: group._id });
  if (!expense) throw new ApiError(404, 'NOT_FOUND', 'Expense not found.');
  return present(expense, group);
}

/**
 * Update an expense, re-resolving the split.
 *
 * Any change to the amount, the split type or the participants invalidates the
 * stored shares, so the split is recalculated from the merged result rather
 * than patched — patching is how a stored share ends up inconsistent with the
 * total it belongs to.
 */
export async function updateExpense(group, expenseId, input) {
  const expense = await GroupExpense.findOne({ _id: expenseId, groupId: group._id });
  if (!expense) throw new ApiError(404, 'NOT_FOUND', 'Expense not found.');

  const merged = {
    totalAmount: input.totalAmount ?? expense.totalAmount,
    splitType: input.splitType ?? expense.splitType,
    paidBy: input.paidBy ?? String(expense.paidBy),
    participants:
      input.participants ??
      expense.participants.map((p) => ({ memberId: String(p.memberId), value: p.value ?? undefined })),
  };

  expense.participants = previewSplit(group, merged);
  expense.totalAmount = merged.totalAmount;
  expense.splitType = merged.splitType;
  expense.paidBy = merged.paidBy;

  if (input.description !== undefined) expense.description = input.description;
  if (input.category !== undefined) expense.category = input.category;
  if (input.notes !== undefined) expense.notes = input.notes;
  if (input.date !== undefined) expense.date = parseCalendarDate(input.date);

  await expense.save();
  return present(expense, group);
}

export async function deleteExpense(group, expenseId) {
  const result = await GroupExpense.deleteOne({ _id: expenseId, groupId: group._id });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'NOT_FOUND', 'Expense not found.');
  }
}
