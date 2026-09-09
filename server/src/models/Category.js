import mongoose from 'mongoose';
import { TRANSACTION_TYPES } from '@spendwise/shared/constants.js';

/**
 * Category (ARCHITECTURE.md §2.2).
 *
 * A row with `userId: null` is a system default visible to everyone; a row
 * with a userId is that user's own custom category. One query reads both:
 *   { userId: { $in: [null, currentUserId] } }
 *
 * Defaults are shared rows rather than copies on each account, so there are 11
 * of them in total rather than 11 per user, and fixing a name or colour fixes
 * it everywhere at once.
 */
const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [30, 'Name must be at most 30 characters'],
    },

    type: {
      type: String,
      required: true,
      enum: TRANSACTION_TYPES,
    },

    icon: { type: String, default: 'circle-dashed' },

    // Stored here so a category renders in the same colour everywhere.
    color: { type: String, default: '#64748B' },

    // System-seeded rows are not editable or deletable by users.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The common read: this user's categories plus the system defaults.
categorySchema.index({ userId: 1, type: 1 });

/**
 * Prevent one user creating two categories with the same name and type.
 *
 * Partial, so it applies only to user-owned rows: without the filter, the
 * system defaults (all sharing userId: null) would collide with each other on
 * names like "Other", which legitimately exists for both income and expense.
 */
categorySchema.index(
  { userId: 1, type: 1, name: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } }
);

export const Category = mongoose.model('Category', categorySchema);
export default Category;
