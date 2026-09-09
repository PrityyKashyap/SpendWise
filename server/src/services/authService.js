/**
 * Authentication business logic (ARCHITECTURE.md §5).
 *
 * No req/res here — these are plain functions over plain values, so they can
 * be unit-tested without a running server.
 */
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/tokens.js';

/**
 * Issue a fresh token pair and record the refresh hash on the user.
 *
 * Storing the hash is what makes logout and rotation real: a refresh token is
 * only accepted if it still matches what we have on file.
 */
async function issueTokens(user) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}

/** Create an account and log the user straight in. */
export async function register({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists.', {
      email: 'Already registered',
    });
  }

  // The pre-save hook hashes the password; it is never stored in plain text.
  const user = await User.create({ name, email, password });
  const tokens = await issueTokens(user);

  return { user: user.toPublicJSON(), ...tokens };
}

/** Verify credentials and start a session. */
export async function login({ email, password }) {
  // password is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email }).select('+password');

  // One identical error for "no such account" and "wrong password". Splitting
  // them would turn this endpoint into an account-enumeration oracle.
  const invalid = new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  if (!user) throw invalid;

  const matches = await user.comparePassword(password);
  if (!matches) throw invalid;

  const tokens = await issueTokens(user);
  return { user: user.toPublicJSON(), ...tokens };
}

/**
 * Exchange a valid refresh token for a new pair (rotation).
 *
 * The old token is invalidated by overwriting the stored hash, so a stolen
 * refresh token works at most once — and its use logs out the legitimate
 * session, which makes the theft visible rather than silent.
 */
export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, 'TOKEN_INVALID', 'No session found. Please log in.');
  }

  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user) {
    throw new ApiError(401, 'TOKEN_INVALID', 'Session no longer valid. Please log in.');
  }

  // The token is cryptographically valid but is not the one we last issued:
  // it was already rotated away, or the user logged out.
  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'TOKEN_INVALID', 'Session no longer valid. Please log in.');
  }

  const tokens = await issueTokens(user);
  return { user: user.toPublicJSON(), ...tokens };
}

/**
 * End the session server-side.
 *
 * Clearing the stored hash is the part that matters — without it, a copied
 * cookie would keep working for the full 7 days, because a JWT cannot be
 * un-issued.
 */
export async function logout(refreshToken) {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
  } catch {
    // An expired or forged token means there is no session to end. Logout is
    // idempotent and must never fail — the client is clearing its state either
    // way, and erroring here would only strand the user in a logged-in UI.
  }
}

/** The currently authenticated user. */
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');
  return user.toPublicJSON();
}

/** Update your own profile (IDEA.md §4). */
export async function updateProfile(userId, data) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');

  if (data.name !== undefined) user.name = data.name;
  if (data.profileImage !== undefined) user.profileImage = data.profileImage;
  if (data.currency !== undefined) user.currency = data.currency.toUpperCase();

  await user.save();
  return user.toPublicJSON();
}

/**
 * Change your password.
 *
 * Every other session is invalidated by clearing the stored refresh hash: if
 * the password is being changed because someone else had access, leaving their
 * session alive would defeat the point. The caller then logs in again.
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Your current password is incorrect.', {
      currentPassword: 'Incorrect password',
    });
  }

  // The pre-save hook hashes it.
  user.password = newPassword;
  user.refreshTokenHash = null;
  await user.save();
}
