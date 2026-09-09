import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User (ARCHITECTURE.md §2.1).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],

      // Never returned by a query unless explicitly requested with
      // .select('+password'). This turns "don't leak the hash" from something
      // you must remember on every endpoint into a safe default.
      select: false,
    },

    profileImage: { type: String, default: '' },

    currency: { type: String, default: 'INR' },

    /**
     * SHA-256 of the user's current refresh token.
     *
     * A JWT cannot be un-issued, so without server-side state, "logout" would
     * leave the token valid for its full 7 days. Storing a hash lets us revoke
     * on logout and detect reuse. We store the HASH, not the token, so a
     * database leak does not hand over live sessions.
     */
    refreshTokenHash: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

/**
 * Hash the password before saving — but only when it actually changed,
 * otherwise every profile update would re-hash an already-hashed password
 * and lock the user out.
 */
// Mongoose 9 does not pass a `next` callback to async middleware — returning
// (or throwing) is what signals completion. Calling next() here would throw.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/** Compare a plaintext candidate against the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Shape sent to the client. Explicitly allow-listed rather than deleting
 * unwanted keys: a field added to the schema later cannot leak by accident.
 */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    profileImage: this.profileImage,
    currency: this.currency,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
export default User;
