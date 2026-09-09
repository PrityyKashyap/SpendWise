import mongoose from 'mongoose';
import { PAYMENT_METHOD_VALUES, TRANSACTION_TYPES } from '@spendwise/shared/constants.js';

/**
 * Transaction — personal income and expenses only (ARCHITECTURE.md §2.3, D5).
 *
 * Group expenses deliberately do NOT create rows here. If paying an ₹8,000
 * group bill wrote an ₹8,000 expense, the dashboard would count money that is
 * really a receivable, double-counting it against "others owe me". The
 * dashboard adds your *share* of group expenses separately (Phase 7).
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: TRANSACTION_TYPES,
    },

    /**
     * Integer paise (ARCHITECTURE.md D1). ₹450.00 is stored as 45000.
     *
     * The direction of money is carried by `type`, never by the sign of the
     * amount — mixing both is how ledgers end up computing -(-500).
     */
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer number of paise',
      },
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [140, 'Description must be at most 140 characters'],
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: PAYMENT_METHOD_VALUES,
    },

    // Phase 9 (IDEA.md §7): named accounts such as "HDFC Bank".
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },

    /**
     * The date the money moved — stored as UTC midnight of that calendar day.
     *
     * Separate from createdAt on purpose: you record Saturday's dinner on
     * Monday. Every list, filter and chart sorts on this; createdAt is audit
     * only.
     */
    date: { type: Date, required: [true, 'Date is required'] },

    notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'] },
  },
  { timestamps: true }
);

// The workhorse: the transaction list and timeline, newest first.
transactionSchema.index({ userId: 1, date: -1 });
// Dashboard income/expense totals.
transactionSchema.index({ userId: 1, type: 1, date: -1 });
// Category breakdown and per-category filtering.
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
// Description search (IDEA.md §9).
transactionSchema.index({ description: 'text' });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
