/**
 * Group and member schemas.
 */
import { z } from 'zod';
import { objectId } from './transaction.js';

/**
 * A member as supplied by the client.
 *
 * Only `name` is required — that is what makes ghost members possible
 * (ARCHITECTURE.md D3). Email is optional and only used to link or invite the
 * person later.
 */
export const memberInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(60, 'Name must be at most 60 characters'),
  email: z.email('Enter a valid email address').trim().toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the group a name')
    .max(60, 'Name must be at most 60 characters'),
  description: z.string().trim().max(200).optional().or(z.literal('')),
  // The creator is added automatically by the server, so a group can be created
  // with no other members and people added later.
  members: z.array(memberInputSchema).max(50, 'A group can have at most 50 members').default([]),
});

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the group a name').max(60).optional(),
    description: z.string().trim().max(200).optional().or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const addMemberSchema = memberInputSchema;

export const updateMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    email: z.email('Enter a valid email address').trim().toLowerCase().optional().or(z.literal('')),
    phone: z.string().trim().max(20).optional().or(z.literal('')),
    role: z.enum(['admin', 'member']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export { objectId };
