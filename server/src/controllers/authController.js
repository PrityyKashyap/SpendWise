/**
 * Auth HTTP layer. Reads the request, calls a service, sends a response —
 * no business logic (ARCHITECTURE.md §1.2).
 */
import * as authService from '../services/authService.js';
import { refreshCookieOptions, REFRESH_COOKIE } from '../utils/tokens.js';

/**
 * Send the auth payload.
 *
 * The refresh token goes ONLY into an httpOnly cookie and never into the JSON
 * body — putting it in the body would expose it to JavaScript and defeat the
 * point of the cookie (ARCHITECTURE.md D7).
 */
function sendAuth(res, statusCode, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(statusCode).json({ success: true, data: { user, accessToken } });
}

export async function register(req, res) {
  sendAuth(res, 201, await authService.register(req.body));
}

export async function login(req, res) {
  sendAuth(res, 200, await authService.login(req.body));
}

export async function refresh(req, res) {
  sendAuth(res, 200, await authService.refresh(req.cookies?.[REFRESH_COOKIE]));
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);

  // clearCookie must be given the same options the cookie was set with, or the
  // browser treats it as a different cookie and silently keeps the original.
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);

  res.status(200).json({ success: true, data: { message: 'Logged out.' } });
}

export async function me(req, res) {
  res.status(200).json({ success: true, data: { user: await authService.getMe(req.user._id) } });
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.status(200).json({ success: true, data: { user } });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user._id, req.body);

  // The password changed, so every refresh token is now void — including this
  // browser's. Clear the cookie so the client is not left holding a dead one.
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);

  res.status(200).json({
    success: true,
    data: { message: 'Password changed. Please log in again.' },
  });
}
