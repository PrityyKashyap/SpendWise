/**
 * Confirm the caller belongs to the group in the URL, and attach it.
 *
 * Runs after `protect` (which establishes who the caller is) and before any
 * group handler. Attaching `req.group` and `req.member` means downstream
 * handlers never have to re-fetch or re-check — and cannot forget to
 * (ARCHITECTURE.md §5.6).
 */
import { findGroupForUser } from '../services/groupService.js';

export async function authorizeGroupMember(req, _res, next) {
  const group = await findGroupForUser(req.user._id, req.params.groupId);

  req.group = group;
  req.member = group.memberForUser(req.user._id);

  next();
}

export default authorizeGroupMember;
