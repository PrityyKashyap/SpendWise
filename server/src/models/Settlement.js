import mongoose from 'mongoose';

export const SETTLEMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];
export const SETTLEMENT_METHODS = ['upi', 'cash', 'bank_transfer', 'other'];

/**
 * Settlement — a record that money actually moved (ARCHITECTURE.md §2.6).
 *
 * IDEA.md §14 asks for Pending → Settled. Three statuses rather than two:
 *
 *  - `confirmed` is the only status that affects balances. One rule, applied
 *    everywhere, so there is never a question about which payments count.
 *  - `pending` exists because a settlement recorded by the PAYER about someone
 *    with a real account is a claim the other side should confirm. Modelling it
 *    now means that trust flow can be switched on later without a migration.
 *  - `cancelled` gives a reversal path. A settlement is a financial record;
 *    deleting one erases history, whereas cancelling preserves it.
 */
const settlementSchema = new mongoose.Schema(
  {
    // Nullable so Phase 9 can add direct friend-to-friend settlements outside
    // any group without a schema change.
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null, index: true },

    // Group member ids, not user ids — so settlements work with ghost members.
    fromMember: { type: mongoose.Schema.Types.ObjectId, required: true },
    toMember: { type: mongoose.Schema.Types.ObjectId, required: true },

    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
      validate: { validator: Number.isInteger, message: 'Amount must be integer paise' },
    },

    status: { type: String, enum: SETTLEMENT_STATUSES, default: 'confirmed' },

    method: { type: String, enum: SETTLEMENT_METHODS, default: 'upi' },

    note: { type: String, trim: true, maxlength: 200, default: '' },

    // Which account recorded this, as distinct from who paid.
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // When the money actually moved, which may not be when it was recorded.
    settledAt: { type: Date, required: true },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Balance computation reads every settlement for a group.
settlementSchema.index({ groupId: 1, status: 1 });
settlementSchema.index({ fromMember: 1 });
settlementSchema.index({ toMember: 1 });
settlementSchema.index({ recordedBy: 1, createdAt: -1 });

/** A settlement cannot be between one person and themselves. */
settlementSchema.pre('validate', function rejectSelfSettlement() {
  if (String(this.fromMember) === String(this.toMember)) {
    this.invalidate('toMember', 'A settlement needs two different people');
  }
});

export const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
