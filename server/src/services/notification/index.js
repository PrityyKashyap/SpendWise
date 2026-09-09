/**
 * Delivery adapters for reminders (IDEA.md §17).
 *
 * The MVP only puts text on the clipboard, so the only adapter is 'copy',
 * which delivers nothing and simply reports that the message is ready. The
 * indirection exists now so that adding Nodemailer, Twilio or the WhatsApp
 * Business API later is a new entry in this table — the message wording, the
 * API contract and the entire client stay untouched.
 *
 * This is deliberately NOT a stub that pretends to work: `copy` genuinely is
 * the whole delivery mechanism today (IDEA.md §32.7).
 */
import { ApiError } from '../../utils/ApiError.js';

const ADAPTERS = {
  /** The user copies the text and sends it themselves. */
  copy: async () => ({ status: 'generated', sentAt: null }),

  // Phase 9:
  //   email:    Nodemailer
  //   sms:      Twilio
  //   whatsapp: WhatsApp Business API
};

export const AVAILABLE_CHANNELS = Object.keys(ADAPTERS);

/**
 * @param {string} channel
 * @param {{ message: string, to: object }} payload
 */
export async function deliver(channel, payload) {
  const adapter = ADAPTERS[channel];

  if (!adapter) {
    throw new ApiError(
      422,
      'CHANNEL_UNAVAILABLE',
      `Sending by ${channel} is not available yet — copy the message and send it yourself.`
    );
  }

  return adapter(payload);
}
