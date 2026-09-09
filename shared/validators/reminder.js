/**
 * Reminder schemas (IDEA.md §16).
 */
import { z } from 'zod';
import { objectId } from './transaction.js';

export const REMINDER_TONES = ['friendly', 'neutral', 'firm'];

/** Channels the API will accept. Only 'copy' is implemented (IDEA.md §17). */
export const REMINDER_CHANNELS = ['copy', 'email', 'sms', 'whatsapp'];

export const generateReminderSchema = z.object({
  // The debtor — who is being reminded.
  fromMember: objectId,
  // The creditor — who is owed.
  toMember: objectId,
  tone: z.enum(REMINDER_TONES).default('friendly'),
  channel: z.enum(REMINDER_CHANNELS).default('copy'),
});

export const listRemindersSchema = z.object({
  toMember: objectId.optional(),
});
