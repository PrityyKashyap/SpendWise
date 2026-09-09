/**
 * Settlement schemas.
 */
import { z } from 'zod';
import { objectId, amountInPaise, calendarDate } from './transaction.js';

export const SETTLEMENT_METHODS = ['upi', 'cash', 'bank_transfer', 'other'];

export const createSettlementSchema = z.object({
  fromMember: objectId,
  toMember: objectId,
  amount: amountInPaise,
  method: z.enum(SETTLEMENT_METHODS).default('upi'),
  note: z.string().trim().max(200).optional().or(z.literal('')),
  settledAt: calendarDate.optional(),
});

export const listSettlementsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

export const balancesQuerySchema = z.object({
  // Query strings are text, so accept the usual truthy spellings.
  simplify: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((value) => value === true || value === 'true' || value === '1'),
});
