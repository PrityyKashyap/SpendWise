/**
 * Reminder message generation (IDEA.md §16, ARCHITECTURE.md §6.7).
 *
 * Generated on the SERVER even though the MVP only copies the text to the
 * clipboard. §17 wants email, SMS and WhatsApp later; with the wording and the
 * delivery seam already here, adding a channel is one adapter and one
 * parameter — the message logic, the endpoint and the whole client stay as
 * they are.
 */
import { Reminder } from '../models/Reminder.js';
import { GroupExpense } from '../models/GroupExpense.js';
import { Settlement } from '../models/Settlement.js';
import { ApiError } from '../utils/ApiError.js';
import { computeBalances, maxSettlementBetween } from './balanceService.js';
import { deliver } from './notification/index.js';

/**
 * Money for humans: ₹500, not ₹500.00.
 *
 * Trailing zero paise are noise in a chat message — §16's example reads
 * "was ₹500". Paise are shown only when they are actually non-zero.
 */
function formatForMessage(paise) {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Message templates, keyed by tone.
 *
 * Kept in one table so new wording — or a new tone — is a data change rather
 * than a code change.
 */
const TEMPLATES = {
  friendly: ({ name, amount, context }) =>
    `Hey ${name} 👋 Your share ${context} was ${amount}. ` +
    `Please send it whenever you get a chance. Thanks!`,

  neutral: ({ name, amount, context }) =>
    `Hi ${name}, a reminder that your share ${context} comes to ${amount}. ` +
    `Let me know once you've sent it.`,

  firm: ({ name, amount, context }) =>
    `Hi ${name}, your share ${context} is ${amount} and is still outstanding. ` +
    `Could you settle it in the next couple of days? Thanks.`,
};

/**
 * Describe what the debt is actually for.
 *
 * §16's example says "your share for dinner", but a balance is an aggregate
 * over several expenses, so the context has to be derived from the ledger:
 * name the expense when there is only one, otherwise summarise. A message that
 * says what it is about is far more likely to get paid than a bare figure.
 */
function describeContext({ expenses, group, debtorMemberId, creditorMemberId }) {
  const shared = expenses.filter(
    (expense) =>
      String(expense.paidBy) === String(creditorMemberId) &&
      expense.participants.some((p) => String(p.memberId) === String(debtorMemberId))
  );

  if (shared.length === 0) return `for ${group.name}`;
  if (shared.length === 1) return `for ${shared[0].description}`;

  // Name the largest, since that is the one they will remember, and say how
  // many others there are.
  const largest = shared.reduce((max, e) => (e.totalAmount > max.totalAmount ? e : max));
  const others = shared.length - 1;
  return `for ${largest.description} and ${others} other expense${others === 1 ? '' : 's'}`;
}

/**
 * Build a reminder for one debt, and record that it was generated.
 */
export async function generateReminder(user, group, { toMember, fromMember, tone = 'friendly', channel = 'copy' }) {
  // fromMember is the debtor (who should pay); toMember is the creditor.
  if (!group.hasMember(fromMember) || !group.hasMember(toMember)) {
    throw new ApiError(422, 'INVALID_PARTICIPANTS', 'Both people must be members of this group.');
  }

  if (String(fromMember) === String(toMember)) {
    throw new ApiError(422, 'INVALID_PARTICIPANTS', 'You cannot remind yourself.');
  }

  const [expenses, settlements] = await Promise.all([
    GroupExpense.find({ groupId: group._id }).lean(),
    Settlement.find({ groupId: group._id }).lean(),
  ]);

  const balances = computeBalances(group, expenses, settlements);

  // Reuse the settlement cap: it is exactly "the most this person could owe
  // that one", accounting for both the pairwise and simplified views.
  const outstanding = maxSettlementBetween(balances, fromMember, toMember);

  const names = new Map(group.members.map((m) => [String(m._id), m.name]));
  const debtorName = names.get(String(fromMember)) ?? 'there';

  if (outstanding === 0) {
    throw new ApiError(
      422,
      'NOTHING_TO_SETTLE',
      `${debtorName} doesn't owe anything right now, so there is nothing to remind about.`
    );
  }

  const message = (TEMPLATES[tone] ?? TEMPLATES.friendly)({
    name: debtorName,
    amount: formatForMessage(outstanding),
    context: describeContext({
      expenses,
      group,
      debtorMemberId: fromMember,
      creditorMemberId: toMember,
    }),
  });

  const delivery = await deliver(channel, { message, to: group.members.find((m) => String(m._id) === String(fromMember)) });

  const reminder = await Reminder.create({
    groupId: group._id,
    fromMember,
    toMember,
    amount: outstanding,
    tone,
    channel,
    message,
    status: delivery.status,
    sentAt: delivery.sentAt,
    createdBy: user._id,
  });

  return present(reminder.toObject(), group);
}

/** Reminder history for a group, newest first (IDEA.md §16). */
export async function listReminders(group, { toMember } = {}) {
  const filter = { groupId: group._id };
  if (toMember) filter.toMember = toMember;

  const reminders = await Reminder.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return reminders.map((reminder) => present(reminder, group));
}

function present(reminder, group) {
  const names = new Map(group.members.map((m) => [String(m._id), m.name]));
  return {
    ...reminder,
    fromName: names.get(String(reminder.fromMember)) ?? 'Removed member',
    toName: names.get(String(reminder.toMember)) ?? 'Removed member',
  };
}
