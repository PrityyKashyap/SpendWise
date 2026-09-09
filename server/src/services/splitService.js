/**
 * Split arithmetic (ARCHITECTURE.md §6).
 *
 * This is the highest-risk code in SpendWise, so it is deliberately pure: no
 * database, no HTTP, no Mongoose. Plain values in, plain values out, which
 * makes every rule below directly unit-testable.
 *
 * Two invariants govern everything here:
 *
 *   I1. For every expense:  Σ participants[].share === totalAmount   (exact paise)
 *   I2. For every group:    Σ members[].netBalance === 0
 *
 * I2 follows from I1: if every expense divides exactly, then every rupee owed
 * by someone is owed to someone. I1 is asserted on every calculation below, so
 * a rounding mistake fails loudly at write time rather than silently corrupting
 * balances that only stop summing to zero weeks later.
 */
import { ApiError } from '../utils/ApiError.js';

/**
 * Split `total` across weighted participants, exactly.
 *
 * The problem this solves: ₹100 between three people is ₹33.333… each. Naive
 * rounding gives ₹33.33 × 3 = ₹99.99 and a paisa disappears, breaking I1.
 *
 * Largest-remainder method:
 *   1. Give everyone their floored share.
 *   2. Hand out the leftover paise one at a time, in a defined order.
 *
 * The order (ARCHITECTURE.md §6.2):
 *   a. the payer first — whoever fronted the cash absorbs the rounding dust,
 *      which is trivially explainable to users and always deterministic;
 *   b. then whoever lost most to flooring (largest fractional remainder);
 *   c. ties broken by memberId, so the result never depends on input order.
 *
 * @param {number} total       integer paise to divide
 * @param {Array<{memberId: string, weight: number}>} participants
 * @param {string} [payerId]   member who paid, given the first leftover paisa
 * @returns {Array<{memberId: string, share: number}>}
 */
export function distribute(total, participants, payerId) {
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);

  if (totalWeight <= 0) {
    throw new ApiError(422, 'INVALID_PARTICIPANTS', 'Split weights must add up to more than zero.');
  }

  // Exact share as an integer numerator over totalWeight, so the remainder is
  // computed without ever creating a float.
  const rows = participants.map((p) => {
    const numerator = total * p.weight;
    return {
      memberId: p.memberId,
      share: Math.floor(numerator / totalWeight),
      remainder: numerator % totalWeight,
    };
  });

  let leftover = total - rows.reduce((sum, row) => sum + row.share, 0);

  if (leftover > 0) {
    const order = [...rows].sort((a, b) => {
      if (payerId) {
        if (a.memberId === payerId) return -1;
        if (b.memberId === payerId) return 1;
      }
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return String(a.memberId).localeCompare(String(b.memberId));
    });

    // leftover is always < number of participants, so this terminates.
    for (let i = 0; i < leftover; i += 1) {
      order[i].share += 1;
    }
    leftover = 0;
  }

  return rows.map(({ memberId, share }) => ({ memberId, share }));
}

/**
 * I1, enforced. The last line of defence before anything is written.
 *
 * If this ever throws, the bug is in the split maths — not in balances, not in
 * settlements — which makes it worth checking on every single calculation.
 */
export function assertSplitSum(participants, totalAmount) {
  const sum = participants.reduce((acc, p) => acc + p.share, 0);
  if (sum !== totalAmount) {
    throw new ApiError(
      500,
      'SPLIT_INVARIANT_VIOLATED',
      `Split failed to balance: shares total ${sum} paise but the expense is ${totalAmount}.`
    );
  }
}

/**
 * Percentages, as integer basis points (hundredths of a percent).
 *
 * Validating percentages as floats is broken in a way that rejects VALID
 * input: 33.33 + 33.33 + 33.34 === 100.00000000000001 in binary floating
 * point, so `sum === 100` fails on a split that is perfectly correct. Even the
 * conversion needs care — 33.33 * 100 is 3332.9999999999995 — hence the round.
 *
 * In basis points the check is exact integer arithmetic: 3333 + 3333 + 3334
 * === 10000, always.
 */
const BASIS_POINTS_IN_FULL = 10000;

function toBasisPoints(percent) {
  return Math.round(percent * 100);
}

/**
 * Cross-field validation for a split.
 *
 * These rules live here rather than in the zod schema because they need the
 * expense total, which a per-field schema cannot see.
 */
function validateSplitInput({ totalAmount, splitType, participants }) {
  const missing = participants.filter((p) => p.value === undefined || p.value === null);

  if (splitType !== 'equal' && missing.length > 0) {
    throw new ApiError(
      422,
      'INVALID_PARTICIPANTS',
      'Every participant needs a value for this split type.',
      { participants: 'Fill in every person' }
    );
  }

  if (splitType === 'exact') {
    if (participants.some((p) => !Number.isInteger(p.value))) {
      throw new ApiError(422, 'INVALID_AMOUNT', 'Amounts must be whole paise.', {
        participants: 'Enter valid amounts',
      });
    }

    const sum = participants.reduce((acc, p) => acc + p.value, 0);
    if (sum !== totalAmount) {
      const difference = totalAmount - sum;
      throw new ApiError(
        422,
        'SPLIT_TOTAL_MISMATCH',
        `Amounts must add up to ${formatPaise(totalAmount)} — currently ${formatPaise(sum)}.`,
        {
          participants:
            difference > 0
              ? `${formatPaise(difference)} still to allocate`
              : `${formatPaise(-difference)} over-allocated`,
        }
      );
    }
  }

  if (splitType === 'percentage') {
    const sum = participants.reduce((acc, p) => acc + toBasisPoints(p.value), 0);
    if (sum !== BASIS_POINTS_IN_FULL) {
      const percent = sum / 100;
      throw new ApiError(
        422,
        'PERCENTAGE_NOT_100',
        `Percentages must add up to 100% — currently ${percent}%.`,
        {
          participants:
            sum < BASIS_POINTS_IN_FULL
              ? `${Math.round((BASIS_POINTS_IN_FULL - sum)) / 100}% still to allocate`
              : `${Math.round((sum - BASIS_POINTS_IN_FULL)) / 100}% over 100%`,
        }
      );
    }
  }

  if (splitType === 'shares') {
    if (participants.some((p) => !Number.isInteger(p.value) || p.value < 1)) {
      throw new ApiError(
        422,
        'INVALID_PARTICIPANTS',
        'Shares must be whole numbers of at least 1.',
        { participants: 'Give everyone at least one share' }
      );
    }
  }
}

/** ₹8,000.00 — for error messages only. */
function formatPaise(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Resolve a split into per-member paise amounts.
 *
 * Every split type routes through `distribute()` with different weights, so
 * there is exactly one implementation of the rounding rule. Phase 6 adds
 * 'exact', 'percentage' and 'shares' here.
 *
 * @param {object} params
 * @param {number} params.totalAmount   integer paise
 * @param {string} params.splitType
 * @param {Array<{memberId: string, value?: number}>} params.participants
 * @param {string} params.paidBy        member id
 */
export function calculateSplits({ totalAmount, splitType, participants, paidBy }) {
  validateSplitInput({ totalAmount, splitType, participants });

  let resolved;

  switch (splitType) {
    case 'equal':
      resolved = distribute(
        totalAmount,
        participants.map((p) => ({ memberId: p.memberId, weight: 1 })),
        paidBy
      );
      break;

    case 'shares':
      // Share counts are already integer weights.
      resolved = distribute(
        totalAmount,
        participants.map((p) => ({ memberId: p.memberId, weight: p.value })),
        paidBy
      );
      break;

    case 'percentage':
      // Percentages as basis-point WEIGHTS, run through the same distributor.
      //
      // The alternative — computing total * percent / 100 per person and
      // rounding each independently — is how a valid 100% split silently
      // produces ₹7,999.98 instead of ₹8,000.00. Weighted distribution cannot
      // do that: the leftover paise are accounted for explicitly.
      resolved = distribute(
        totalAmount,
        participants.map((p) => ({ memberId: p.memberId, weight: toBasisPoints(p.value) })),
        paidBy
      );
      break;

    case 'exact':
      // Already validated to sum exactly to the total, so used as given.
      resolved = participants.map((p) => ({ memberId: p.memberId, share: p.value }));
      break;

    default:
      throw new ApiError(422, 'INVALID_SPLIT_TYPE', `Unknown split type "${splitType}".`);
  }

  assertSplitSum(resolved, totalAmount);

  // `value` preserves the raw input (a percentage, a share count) purely so
  // the edit form can repopulate and the UI can show "40%" rather than a bare
  // rupee figure. It is never used in arithmetic.
  return resolved.map((row) => {
    const input = participants.find((p) => p.memberId === row.memberId);
    return { memberId: row.memberId, share: row.share, value: input?.value ?? null };
  });
}
