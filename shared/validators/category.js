/**
 * Category schemas (IDEA.md §6 — users can create custom categories).
 */
import { z } from 'zod';
import { TRANSACTION_TYPES } from '../constants.js';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a category name')
    .max(30, 'Name must be at most 30 characters'),
  type: z.enum(TRANSACTION_TYPES, 'Choose income or expense'),
  icon: z.string().trim().max(40).default('circle-dashed'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Pick a colour')
    .default('#64748B'),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');
