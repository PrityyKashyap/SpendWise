/**
 * Debt simplification (ARCHITECTURE.md §6.5, IDEA.md §15).
 *
 * The problem: after a real trip everyone owes everyone a little, and settling
 * up means six separate UPI transfers nobody wants to make.
 *
 * Greedy creditor/debtor matching: repeatedly pair the largest debtor with the
 * largest creditor and move the smaller of the two amounts. Each step zeroes at
 * least one person, so with n members the result is never more than n − 1
 * transactions, however tangled the original debts were.
 *
 * Two honest caveats:
 *
 * 1. Greedy is not provably minimal. Finding the true minimum number of
 *    settling transactions is NP-hard — it reduces from subset-sum, since any
 *    subset of members whose balances cancel exactly could settle among
 *    themselves and save a transaction, and finding such subsets is the hard
 *    part. Greedy guarantees ≤ n − 1, which is optimal in the common case.
 *    Chasing exact minimality would mean exponential search to save typically
 *    one transaction (IDEA.md §32.20: simplest production-appropriate answer).
 *
 * 2. It can create a debt between two people who never shared an expense.
 *    That is mathematically correct and is what Splitwise does, but it
 *    surprises people — which is exactly why simplification is an explicit
 *    toggle and the raw pairwise view is the default (decision D6).
 */

/**
 * @param {Array<{memberId: string, name: string, net: number}>} netBalances
 * @returns {Array<{from, fromName, to, toName, amount}>}
 */
export function simplifyDebts(netBalances) {
  // Copies, so the caller's balances are not mutated.
  const debtors = netBalances
    .filter((b) => b.net < 0)
    .map((b) => ({ ...b, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining || a.memberId.localeCompare(b.memberId));

  const creditors = netBalances
    .filter((b) => b.net > 0)
    .map((b) => ({ ...b, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining || a.memberId.localeCompare(b.memberId));

  const transactions = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
      transactions.push({
        from: debtor.memberId,
        fromName: debtor.name,
        to: creditor.memberId,
        toName: creditor.name,
        amount,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    // At least one side hits zero each iteration, so this terminates in at
    // most (debtors + creditors − 1) steps.
    if (debtor.remaining === 0) d += 1;
    if (creditor.remaining === 0) c += 1;
  }

  return transactions;
}
