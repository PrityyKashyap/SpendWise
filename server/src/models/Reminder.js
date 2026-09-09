import mongoose from 'mongoose';

export const REMINDER_CHANNELS = ['copy', 'email', 'sms', 'whatsapp'];
export const REMINDER_STATUSES = ['generated', 'sent', 'failed'];
export const REMINDER_TONES = ['friendly', 'neutral', 'firm'];

/**
 * A reminder that was generated (IDEA.md §16).
 *
 * Worth storing even though the MVP only copies text to the clipboard: it
 * answers "have I already asked?", which is the thing that stops you nudging
 * someone twice in a week.
 *
 * The `channel` and `status` fields are the seam for IDEA.md §17. Today every
 * row is channel 'copy' / status 'generated'; adding email or WhatsApp later
 * means a new adapter writing 'sent' or 'failed' here, with no schema change.
 */
const reminderSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },

    // Member ids, so reminders work for ghost members too (D3).
    fromMember: { type: mongoose.Schema.Types.ObjectId, required: true },
    toMember: { type: mongoose.Schema.Types.ObjectId, required: true },

    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
      validate: { validator: Number.isInteger, message: 'Amount must be integer paise' },
    },

    tone: { type: String, enum: REMINDER_TONES, default: 'friendly' },
    channel: { type: String, enum: REMINDER_CHANNELS, default: 'copy' },
    status: { type: String, enum: REMINDER_STATUSES, default: 'generated' },

    // The exact text produced, kept so history shows what was actually said
    // rather than regenerating it from a template that may have changed.
    message: { type: String, required: true, maxlength: 600 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reminderSchema.index({ groupId: 1, createdAt: -1 });
reminderSchema.index({ groupId: 1, toMember: 1, createdAt: -1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
