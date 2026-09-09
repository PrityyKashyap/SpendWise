/**
 * Settlements — recording that money moved (ARCHITECTURE.md §6.6).
 */
import { Settlement } from '../models/Settlement.js';
import { GroupExpense } from '../models/GroupExpense.js';
import { ApiError } from '../utils/ApiError.js';
import { parseCalendarDate } from '../utils/date.js';
import { computeBalances, maxSettlementBetween, balanceForMember } from './balanceService.js';
import { simplifyDebts } from './simplifyService.js';

/** Load everything a balance calculation needs, in one round trip each. */
async function loadLedger(group) {
  const [expenses, settlements] = await Promise.all([
    GroupExpense.find({ groupId: group._id }).lean(),
    Settlement.find({ groupId: group._id }).lean(),
  ]);
  return { expenses, settlements };
}

/**
 * Balances for a group, optionally simplified.
 *
 * `simplified` is only populated when asked for: pairwise is the default view
 * because it is the raw ledger truth and can be explained expense by expense
 * (decision D6).
 */
export async function getBalances(group, { simplify = false, forMemberId } = {}) {
  const { expenses, settlements } = await loadLedger(group);
  const balances = computeBalances(group, expenses, settlements);

  return {
    netBalances: balances.netBalances,
    pairwise: balances.pairwise,
    simplified: simplify ? simplifyDebts(balances.netBalances) : null,
    myBalance: forMemberId ? balanceForMember(balances, forMemberId) : null,
    // Exposed so the client can verify what it was sent. If this is ever
    // non-zero the balances are wrong, and silently rendering them would be
    // worse than showing nothing.
    checksum: balances.checksum,
  };
}

export async function createSettlement(user, group, input) {
  if (!group.hasMember(input.fromMember) || !group.hasMember(input.toMember)) {
    throw new ApiError(422, 'INVALID_PARTICIPANTS', 'Both people must be members of this group.');
  }

  if (String(input.fromMember) === String(input.toMember)) {
    throw new ApiError(422, 'INVALID_PARTICIPANTS', 'A settlement needs two different people.');
  }

  const { expenses, settlements } = await loadLedger(group);
  const balances = computeBalances(group, expenses, settlements);

  // Guard against typos, not against a particular routing: the cap is the
  // larger of the net and pairwise figures, because the two balance views
  // legitimately show different amounts for the same pair (balanceService).
  const cap = maxSettlementBetween(balances, input.fromMember, input.toMember);

  if (cap === 0) {
    const names = nameLookup(group);
    throw new ApiError(
      422,
      'NOTHING_TO_SETTLE',
      `${names(input.fromMember)} does not owe ${names(input.toMember)} anything.`,
      { amount: 'Nothing outstanding between these two' }
    );
  }

  if (input.amount > cap) {
    throw new ApiError(
      422,
      'SETTLEMENT_EXCEEDS_DEBT',
      `That is more than is owed — the most outstanding is ${formatPaise(cap)}.`,
      { amount: `At most ${formatPaise(cap)}` }
    );
  }

  const settlement = await Settlement.create({
    groupId: group._id,
    fromMember: input.fromMember,
    toMember: input.toMember,
    amount: input.amount,
    method: input.method ?? 'upi',
    note: input.note ?? '',
    // Recorded by a member of the group, so it is trusted immediately. The
    // pending/confirm handshake is reserved for the Phase 9 trust flow.
    status: 'confirmed',
    confirmedAt: new Date(),
    recordedBy: user._id,
    settledAt: input.settledAt ? parseCalendarDate(input.settledAt) : new Date(),
  });

  return present(settlement.toObject(), group);
}

export async function listSettlements(group, { status } = {}) {
  const filter = { groupId: group._id };
  if (status) filter.status = status;

  const settlements = await Settlement.find(filter).sort({ settledAt: -1, _id: -1 }).lean();
  return settlements.map((settlement) => present(settlement, group));
}

/**
 * Cancel a settlement.
 *
 * Cancelled rather than deleted: the record that someone believed money moved
 * is itself worth keeping, and balances simply stop counting it.
 */
export async function cancelSettlement(group, settlementId) {
  const settlement = await Settlement.findOne({ _id: settlementId, groupId: group._id });
  if (!settlement) throw new ApiError(404, 'NOT_FOUND', 'Settlement not found.');

  if (settlement.status === 'cancelled') {
    throw new ApiError(409, 'ALREADY_CANCELLED', 'This settlement is already cancelled.');
  }

  settlement.status = 'cancelled';
  await settlement.save();

  return present(settlement.toObject(), group);
}

function nameLookup(group) {
  const names = new Map(group.members.map((m) => [String(m._id), m.name]));
  return (memberId) => names.get(String(memberId)) ?? 'Removed member';
}

function present(settlement, group) {
  const names = nameLookup(group);
  return {
    ...settlement,
    fromName: names(settlement.fromMember),
    toName: names(settlement.toMember),
  };
}

function formatPaise(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
