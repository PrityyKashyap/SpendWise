/**
 * Budget schemas (IDEA.md §20).
 */
import { z } from 'zod';
import { objectId, amountInPaise } from './transaction.js';

export const createBudgetSchema = z.object({
  categoryId: objectId,
  amount: amountInPaise,
  warnAtPercent: z.number().int().min(1).max(100).default(80),
});

export const updateBudgetSchema = z
  .object({
    amount: amountInPaise.optional(),
    warnAtPercent: z.number().int().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM')
    .optional(),
});
