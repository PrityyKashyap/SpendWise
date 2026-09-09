/**
 * Balance computation — who owes whom (ARCHITECTURE.md §6.4).
 *
 * Balances are DERIVED on every read, never stored (decision D4). A stored
 * balance is a cache, and a cache of financial data must be invalidated
 * correctly on every create, edit, delete and settle. Get one path wrong and
 * the app silently reports wrong money — the worst bug class here, because it
 * is invisible. Recomputing from the source documents makes that impossible.
 *
 * The cost is a single linear pass over the group's expenses, which at
 * realistic sizes is single-digit milliseconds.
 */

/**
 * @param {object} group   a Group document (for the member roster)
 * @param {Array}  expenses  GroupExpense documents
 * @param {Array}  settlements  Settlement documents (all statuses; filtered here)
 */
export function computeBalances(group, expenses, settlements = []) {
  const paid = new Map();
  const owed = new Map();

  // Pair debts, keyed "debtor:creditor" while accumulating.
  const pairs = new Map();

  for (const member of group.members) {
    paid.set(String(member._id), 0);
    owed.set(String(member._id), 0);
  }

  const add = (map, key, amount) => map.set(key, (map.get(key) ?? 0) + amount);

  for (const expense of expenses) {
    const payer = String(expense.paidBy);
    add(paid, payer, expense.totalAmount);

    for (const participant of expense.participants) {
      const member = String(participant.memberId);
      add(owed, member, participant.share);

      // The payer's own share is not a debt to themselves.
      if (member !== payer) {
        add(pairs, `${member}:${payer}`, participant.share);
      }
    }
  }

  /**
   * A confirmed settlement is treated as the payer having "paid in" that
   * amount and the receiver having paid out.
   *
   * One uniform mechanism, no special-casing: it composes correctly with any
   * number of settlements, and partial payments fall out for free rather than
   * needing a separate state.
   *
   * Only 'confirmed' settlements move balances — stated once, applied
   * everywhere.
   */
  for (const settlement of settlements) {
    if (settlement.status !== 'confirmed') continue;

    const from = String(settlement.fromMember);
    const to = String(settlement.toMember);

    add(paid, from, settlement.amount);
    add(paid, to, -settlement.amount);

    // Paying reduces what `from` owes `to`.
    add(pairs, `${from}:${to}`, -settlement.amount);
  }

  const netBalances = group.members.map((member) => {
    const id = String(member._id);
    return {
      memberId: id,
      name: member.name,
      userId: member.userId ? String(member.userId) : null,
      paid: paid.get(id) ?? 0,
      owed: owed.get(id) ?? 0,
      // Positive: the group owes them. Negative: they owe the group.
      net: (paid.get(id) ?? 0) - (owed.get(id) ?? 0),
    };
  });

  return {
    netBalances,
    pairwise: nettedPairs(pairs, group),
    // I2 — surfaced rather than asserted, so a caller can check it and tests
    // can prove it. If this is ever non-zero, money has been invented.
    checksum: netBalances.reduce((sum, b) => sum + b.net, 0),
  };
}

/**
 * Collapse two-way debts into one direction per pair.
 *
 * "A owes B ₹600" and "B owes A ₹200" is really "A owes B ₹400". Presenting
 * both directions would be technically true and practically useless.
 */
function nettedPairs(pairs, group) {
  const nameOf = new Map(group.members.map((m) => [String(m._id), m.name]));
  const seen = new Set();
  const result = [];

  for (const key of pairs.keys()) {
    const [a, b] = key.split(':');
    const pairKey = [a, b].sort().join('|');
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    const forward = pairs.get(`${a}:${b}`) ?? 0;
    const backward = pairs.get(`${b}:${a}`) ?? 0;
    const net = forward - backward;

    if (net === 0) continue;

    const [from, to, amount] = net > 0 ? [a, b, net] : [b, a, -net];
    result.push({
      from,
      fromName: nameOf.get(from) ?? 'Removed member',
      to,
      toName: nameOf.get(to) ?? 'Removed member',
      amount,
    });
  }

  return result.sort((x, y) => y.amount - x.amount);
}

/**
 * The most a member could meaningfully pay another, in paise.
 *
 * This is deliberately the MAXIMUM of two different numbers, because the two
 * balance views disagree about the same pair and both are legitimate:
 *
 *   - Pairwise, Rahul may owe Prity ₹1,400 directly while his NET is only
 *     −₹700 (others owe him ₹700). Paying the full ₹1,400 is valid.
 *   - Simplified, Aman may be asked to pay Prity ₹2,300 — his whole net debt —
 *     where he only owes her ₹1,800 directly. That is also valid.
 *
 * Capping at either one alone would reject a settlement the user was shown by
 * the other view, so the guard uses whichever is larger. It exists to catch
 * typos, not to enforce a particular routing.
 */
export function maxSettlementBetween(balances, fromMemberId, toMemberId) {
  const from = String(fromMemberId);
  const to = String(toMemberId);

  const net = balances.netBalances.find((b) => b.memberId === from);
  const netDebt = net && net.net < 0 ? -net.net : 0;

  const pair = balances.pairwise.find((p) => p.from === from && p.to === to);
  const pairDebt = pair?.amount ?? 0;

  return Math.max(netDebt, pairDebt);
}

/** One member's position, for "you are owed / you owe" summaries. */
export function balanceForMember(balances, memberId) {
  const id = String(memberId);
  const entry = balances.netBalances.find((b) => b.memberId === id);
  if (!entry) return { memberId: id, net: 0, owedToMe: 0, iOwe: 0 };

  const owedToMe = balances.pairwise
    .filter((p) => p.to === id)
    .reduce((sum, p) => sum + p.amount, 0);

  const iOwe = balances.pairwise
    .filter((p) => p.from === id)
    .reduce((sum, p) => sum + p.amount, 0);

  return { memberId: id, net: entry.net, owedToMe, iOwe };
}
