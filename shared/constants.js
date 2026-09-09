/**
 * Values shared by the client and server.
 *
 * Defined once so a dropdown option can never drift from what the API accepts
 * (IDEA.md §32.16).
 */

/** How a transaction was paid for (IDEA.md §7). */
export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value);

export const TRANSACTION_TYPES = ['income', 'expense'];

/**
 * System default categories.
 *
 * Inserted once by `npm run seed` as shared rows with `userId: null`, visible
 * to every user (ARCHITECTURE.md §2.2) — not copied onto each account.
 *
 * Colours are fixed here so a category is the same colour in the pie chart,
 * the trend chart and the transaction row.
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'utensils', color: '#F97316' },
  { name: 'Transport', icon: 'car', color: '#0EA5E9' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899' },
  { name: 'Rent', icon: 'home', color: '#8B5CF6' },
  { name: 'Bills', icon: 'receipt', color: '#EF4444' },
  { name: 'Education', icon: 'graduation-cap', color: '#14B8A6' },
  { name: 'Entertainment', icon: 'clapperboard', color: '#F59E0B' },
  { name: 'Health', icon: 'heart-pulse', color: '#10B981' },
  { name: 'Travel', icon: 'plane', color: '#3B82F6' },
  { name: 'Subscriptions', icon: 'repeat', color: '#A855F7' },
  { name: 'Other', icon: 'circle-dashed', color: '#64748B' },
];

/** Income sources (IDEA.md §5). */
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'banknote', color: '#059669' },
  { name: 'Freelancing', icon: 'laptop', color: '#0D9488' },
  { name: 'Family', icon: 'users', color: '#7C3AED' },
  { name: 'Refund', icon: 'undo-2', color: '#0284C7' },
  { name: 'Gift', icon: 'gift', color: '#DB2777' },
  { name: 'Other', icon: 'circle-dashed', color: '#64748B' },
];
