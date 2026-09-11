/**
 * Demo data for the public landing page.
 *
 * Every figure here is invented and hard-coded. The landing page is public, so
 * it must never touch the API or render a real person's finances — keeping the
 * numbers in one clearly-labelled module makes that easy to audit at a glance.
 *
 * Amounts are plain rupees, not the integer paise the real app uses (D1).
 * These are marketing illustrations showing round numbers like ₹32,400; the
 * paise-accurate formatter in utils/money.js would render ₹32,400.00, which is
 * the right answer in a ledger and the wrong one in a hero section.
 */

/** Whole rupees → "₹32,400". Display-only, landing page only. */
export function inr(rupees) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rupees)}`;
}

export const SUMMARY = [
  { label: 'Balance', value: 32400, tone: 'ink' },
  { label: 'Income', value: 45000, tone: 'income' },
  { label: 'Expenses', value: 18420, tone: 'expense' },
  { label: 'Savings', value: 26580, tone: 'brand' },
];

/** Daily spend across a month — drives the hero's area chart. */
export const SPEND_SERIES = [
  32, 48, 40, 62, 55, 71, 58, 80, 64, 88, 74, 96, 82, 108, 91,
];

export const CATEGORIES = [
  { name: 'Food & dining', value: 6240, share: 34, color: '#5B4BFF' },
  { name: 'Transport', value: 3860, share: 21, color: '#7C5CFC' },
  { name: 'Shopping', value: 3120, share: 17, color: '#A78BFA' },
  { name: 'Bills', value: 2480, share: 13, color: '#C4B5FD' },
  { name: 'Other', value: 2720, share: 15, color: '#DDD6FE' },
];

export const RECENT = [
  { name: 'Blue Tokai Coffee', category: 'Food & dining', amount: -420, when: 'Today' },
  { name: 'Salary', category: 'Income', amount: 45000, when: '1 Sep' },
  { name: 'Metro card top-up', category: 'Transport', amount: -600, when: '31 Aug' },
];

export const BUDGETS = [
  { name: 'Food', spent: 4200, limit: 5000 },
  { name: 'Shopping', spent: 3100, limit: 4000 },
  { name: 'Transport', spent: 1800, limit: 2500 },
  { name: 'Entertainment', spent: 1200, limit: 2000 },
];

/** Weekend Trip — the group-splitting showcase. */
export const TRIP = {
  name: 'Weekend Trip',
  members: ['You', 'Aisha', 'Rahul', 'Arjun'],
  expenses: [
    { label: 'Hotel', amount: 4800 },
    { label: 'Food', amount: 2400 },
    { label: 'Transport', amount: 1600 },
  ],
  settlement: { from: 'You', to: 'Rahul', amount: 600 },
};

export const HEALTH = {
  score: 82,
  verdict: 'Excellent',
  metrics: [
    { label: 'Savings rate', value: 85 },
    { label: 'Budget adherence', value: 78 },
    { label: 'Spending consistency', value: 80 },
    { label: 'Recurring expenses', value: 92 },
  ],
};

/** Income vs expenses over six months — the analytics showcase. */
export const MONTHLY = [
  { month: 'Apr', income: 42000, expense: 19800 },
  { month: 'May', income: 45000, expense: 22400 },
  { month: 'Jun', income: 43500, expense: 17900 },
  { month: 'Jul', income: 47000, expense: 24100 },
  { month: 'Aug', income: 45000, expense: 20300 },
  { month: 'Sep', income: 45000, expense: 18420 },
];
