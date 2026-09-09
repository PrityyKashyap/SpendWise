import mongoose from 'mongoose';

/**
 * A monthly spending limit for one category (IDEA.md §20).
 *
 * Only the LIMIT is stored. Spending against it is computed from transactions
 * on every read, the same rule as group balances (decision D4): a stored
 * "spent so far" would be a cache needing correct invalidation on every
 * transaction create, edit, delete and category change, and a stale budget
 * that says you have room when you do not is worse than no budget at all.
 */
const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Choose a category'],
    },

    /** Integer paise, like every other amount (D1). */
    amount: {
      type: Number,
      required: [true, 'Set a budget amount'],
      min: [1, 'Budget must be greater than zero'],
      validate: { validator: Number.isInteger, message: 'Amount must be integer paise' },
    },

    // Only monthly for now. Kept as a field so weekly or yearly can be added
    // without a migration.
    period: { type: String, enum: ['monthly'], default: 'monthly' },

    /**
     * Warn before the limit is actually breached, as a percentage.
     *
     * A budget that only speaks up once you have already overspent is a
     * report, not a budget — by then the money is gone.
     */
    warnAtPercent: { type: Number, default: 80, min: 1, max: 100 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One active budget per category per period — two limits for "Food" would be
// ambiguous about which one applies.
budgetSchema.index(
  { userId: 1, categoryId: 1, period: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
