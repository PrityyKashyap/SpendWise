/**
 * Transaction schemas, shared by the client form and the API.
 */
import { z } from 'zod';
import { PAYMENT_METHOD_VALUES, TRANSACTION_TYPES } from '../constants.js';

/** A MongoDB ObjectId as it appears in JSON. */
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/**
 * An amount in integer paise (ARCHITECTURE.md D1).
 *
 * `int()` is the guard that keeps floats out of the money layer: a client
 * sending 45.5 paise is a bug, and it is rejected here rather than silently
 * rounded somewhere deeper.
 *
 * Sign is carried by `type`, never by the amount — which is why the minimum is
 * 1, satisfying IDEA.md §29's "negative expense" and "invalid amount" cases.
 */
export const amountInPaise = z
  .int('Enter a valid amount')
  .min(1, 'Amount must be greater than zero')
  .max(100_000_000_000, 'Amount is too large'); // ₹1,000,000,000 ceiling

/**
 * A calendar date, as YYYY-MM-DD.
 *
 * Date-only on purpose. Accepting a full timestamp would make "which day was
 * this?" depend on the reader's timezone; the server stores this as UTC
 * midnight and every display formats in UTC, so the day you pick is the day
 * you see (ARCHITECTURE.md appendix #9).
 */
export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Enter a valid date');

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES, 'Choose income or expense'),
  amount: amountInPaise,
  categoryId: objectId,
  description: z
    .string()
    .trim()
    .min(1, 'Add a short description')
    .max(140, 'Description must be at most 140 characters'),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES, 'Choose a payment method'),
  date: calendarDate,
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
});

/**
 * Updates are partial, but never empty — an update with no fields is almost
 * always a client bug, and failing loudly beats a silent no-op.
 */
export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

/** Query parameters for the transaction list (ARCHITECTURE.md §3.4). */
export const listTransactionsSchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  categoryId: objectId.optional(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional(),
  from: calendarDate.optional(),
  to: calendarDate.optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
  search: z.string().trim().max(140).optional(),
  sort: z.enum(['-date', 'date', '-amount', 'amount']).default('-date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Query for the dashboard endpoints. */
export const dashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

/** Query for listing categories. */
export const listCategoriesSchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
});

/** Query for the analytics endpoints. */
export const analyticsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM')
    .optional(),
  months: z.coerce.number().int().min(1).max(24).default(6),
});
