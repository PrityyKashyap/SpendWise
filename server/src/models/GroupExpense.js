import mongoose from 'mongoose';

export const SPLIT_TYPES = ['equal', 'exact', 'percentage', 'shares'];

/**
 * One participant's resolved obligation in a group expense.
 *
 * `share` is ALWAYS a resolved paise amount, for every split type — the most
 * important decision in this schema after integer paise.
 *
 * The temptation is to store percentages for a percentage split and let each
 * reader recompute. Don't: every consumer (balances, simplification, the UI,
 * reminders) would then have to independently reproduce the exact same
 * rounding, and any one of them differing by a paisa produces balances that do
 * not reconcile. Instead the split is resolved ONCE at write time by
 * splitService, validated to sum exactly to totalAmount, and stored. Every
 * reader just adds integers.
 */
const participantSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, required: true },

    share: {
      type: Number,
      required: true,
      min: [0, 'A share cannot be negative'],
      validate: { validator: Number.isInteger, message: 'Share must be integer paise' },
    },

    // The raw input — 40 for 40%, 2 for 2 shares. Kept so the edit form can
    // repopulate and the UI can display "40%" rather than a bare amount.
    // Never used in arithmetic.
    value: { type: Number, default: null },
  },
  { _id: false }
);

/**
 * GroupExpense — the ledger (ARCHITECTURE.md §2.5).
 *
 * `paidBy` and `participants[].memberId` reference Group.members[]._id, never
 * User ids, so ghost members work everywhere (D3).
 */
const groupExpenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [140, 'Description must be at most 140 characters'],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
      validate: { validator: Number.isInteger, message: 'Amount must be integer paise' },
    },

    currency: { type: String, default: 'INR' },

    paidBy: { type: mongoose.Schema.Types.ObjectId, required: true },

    splitType: { type: String, enum: SPLIT_TYPES, required: true },

    participants: {
      type: [participantSchema],
      validate: {
        validator: (participants) => participants.length > 0,
        message: 'An expense needs at least one participant',
      },
    },

    category: { type: String, trim: true, maxlength: 40, default: '' },

    date: { type: Date, required: true },

    notes: { type: String, trim: true, maxlength: 500, default: '' },

    // Phase 9 (IDEA.md §18).
    receiptUrl: { type: String, default: null },

    // Audit: which account entered this, as distinct from who paid.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// The expense list and the balance computation.
groupExpenseSchema.index({ groupId: 1, date: -1 });
// "My share across all groups", for the dashboard's D5 arithmetic in Phase 7.
groupExpenseSchema.index({ 'participants.memberId': 1 });

export const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);
export default GroupExpense;
