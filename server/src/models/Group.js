import mongoose from 'mongoose';

/**
 * A group member (ARCHITECTURE.md D3, §2.4).
 *
 * `userId` is OPTIONAL, and that is the decision that makes the app usable on
 * day one. IDEA.md's own example is "Goa Trip 2026 — Me, Rahul, Priya, Aman",
 * and Rahul, Priya and Aman do not have SpendWise accounts. If members were
 * plain User references you could not create that group until you convinced
 * three friends to sign up — the headline feature would be unusable.
 *
 * So a member is either a linked account or a name-only placeholder ("ghost
 * member"). Every split, balance and settlement references this subdocument's
 * own `_id`, never `userId`. If Rahul signs up later, setting `userId` on his
 * row links him and all historical balances still resolve — no migration.
 */
const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Always present, for both ghost and linked members, so the UI never has
    // to fall back to "Unknown" while resolving a user.
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [60, 'Name must be at most 60 characters'],
    },

    email: { type: String, default: null, lowercase: true, trim: true },

    // Reserved for the messaging integrations in IDEA.md §17.
    phone: { type: String, default: null, trim: true },

    role: { type: String, enum: ['admin', 'member'], default: 'member' },

    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Group (ARCHITECTURE.md §2.4).
 *
 * Members are embedded rather than a separate collection: groups are small and
 * bounded, and every balance screen needs the whole roster at once. That is the
 * textbook case for embedding — one read instead of a join.
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [60, 'Name must be at most 60 characters'],
    },

    description: { type: String, trim: true, maxlength: 200, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    members: {
      type: [memberSchema],
      validate: {
        validator: (members) => members.length > 0,
        message: 'A group needs at least one member',
      },
    },

    currency: { type: String, default: 'INR' },

    /**
     * Archived rather than deleted.
     *
     * Deleting a group with unsettled balances destroys the record of who owes
     * whom. Archiving hides it while the ledger survives.
     */
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// "Every group I'm in" — a multikey index over the embedded members.
groupSchema.index({ 'members.userId': 1, isArchived: 1 });
groupSchema.index({ createdBy: 1 });

/** The member subdocument for a given user, or undefined if not a member. */
groupSchema.methods.memberForUser = function memberForUser(userId) {
  return this.members.find((m) => m.userId && String(m.userId) === String(userId));
};

/** Does this member id exist in the group? */
groupSchema.methods.hasMember = function hasMember(memberId) {
  return this.members.some((m) => String(m._id) === String(memberId));
};

export const Group = mongoose.model('Group', groupSchema);
export default Group;
