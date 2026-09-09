/**
 * Group expense schemas.
 *
 * Phase 5 implements 'equal'. Phase 6 adds 'exact', 'percentage' and 'shares',
 * each of which carries its own cross-field rule (totals matching, percentages
 * summing to 100) that lives in splitService rather than here — those checks
 * need the expense total, which a per-field schema cannot see.
 */
import { z } from 'zod';
import { objectId, amountInPaise, calendarDate } from './transaction.js';

export const SPLIT_TYPES = ['equal', 'exact', 'percentage', 'shares'];

/**
 * A participant in a split.
 *
 * `value` carries whatever the chosen split type needs: nothing for equal, the
 * paise amount for exact, the percentage for percentage, the share count for
 * shares.
 */
export const participantInputSchema = z.object({
  memberId: objectId,
  value: z.number().min(0, 'Cannot be negative').optional(),
});

export const createGroupExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Add a short description')
    .max(140, 'Description must be at most 140 characters'),
  totalAmount: amountInPaise,
  paidBy: objectId,
  splitType: z.enum(SPLIT_TYPES, 'Choose how to split this'),
  participants: z
    .array(participantInputSchema)
    .min(1, 'Choose at least one participant')
    .refine(
      (participants) =>
        new Set(participants.map((p) => p.memberId)).size === participants.length,
      'The same person cannot appear twice'
    ),
  category: z.string().trim().max(40).optional().or(z.literal('')),
  date: calendarDate,
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const updateGroupExpenseSchema = createGroupExpenseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const listGroupExpensesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
