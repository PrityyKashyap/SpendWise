/**
 * Auth request schemas.
 *
 * Written in plain JS with no server-only imports so the client can import
 * this exact file for form validation — the reason zod was chosen over
 * express-validator (ARCHITECTURE.md §1.4). One definition, so the two sides
 * cannot drift.
 */
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters'); // bcrypt ignores bytes past 72

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  // Deliberately only "required" here, not the full password rules: telling a
  // user at login that their password is too short reveals the rules to an
  // attacker and helps nobody who already has an account.
  password: z.string().min(1, 'Password is required'),
});

/** Editing your own profile (IDEA.md §4). */
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be at most 60 characters')
      .optional(),
    profileImage: z.url('Enter a valid image URL').optional().or(z.literal('')),
    currency: z.string().trim().length(3, 'Use a 3-letter currency code').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

/**
 * Changing your password.
 *
 * The current password is required even though the request is already
 * authenticated: an access token left open on a shared machine should not be
 * enough to lock the real owner out of their account.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  });
