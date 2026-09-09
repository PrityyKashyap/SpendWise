/**
 * Group business logic (ARCHITECTURE.md §3.5).
 */
import { Group } from '../models/Group.js';
import { GroupExpense } from '../models/GroupExpense.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Load a group the user belongs to.
 *
 * Membership is part of the query, so a group the user is not in simply is not
 * found. 404 rather than 403 — a 403 would confirm the group exists
 * (ARCHITECTURE.md §3.1).
 */
export async function findGroupForUser(userId, groupId) {
  const group = await Group.findOne({ _id: groupId, 'members.userId': userId });
  if (!group) throw new ApiError(404, 'NOT_FOUND', 'Group not found.');
  return group;
}

/**
 * If a member's email matches a registered account, link it.
 *
 * This is what upgrades a ghost member into a real one: add "rahul@ex.com" and
 * if Rahul already has an account, his member row is linked immediately and he
 * sees the group. If not, he stays a ghost and the group works anyway (D3).
 */
async function resolveUserId(email) {
  if (!email) return null;
  const user = await User.findOne({ email }).select('_id').lean();
  return user?._id ?? null;
}

/** Build a member subdocument from client input. */
async function buildMember(input, { role = 'member' } = {}) {
  const email = input.email?.trim() ? input.email.trim().toLowerCase() : null;
  return {
    userId: await resolveUserId(email),
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || null,
    role,
  };
}

export async function createGroup(user, { name, description, members = [] }) {
  // The creator is always a member, and an admin — otherwise they could create
  // a group they cannot then administer.
  const creatorMember = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: 'admin',
  };

  const others = await Promise.all(members.map((m) => buildMember(m)));

  // Don't add the creator twice if they also typed their own email.
  const deduped = others.filter(
    (m) => !m.email || m.email.toLowerCase() !== user.email.toLowerCase()
  );

  const group = await Group.create({
    name,
    description: description ?? '',
    createdBy: user._id,
    members: [creatorMember, ...deduped],
  });

  return group.toObject();
}

/** Groups the user belongs to, with a light summary for the list screen. */
export async function listGroups(userId) {
  const groups = await Group.find({ 'members.userId': userId, isArchived: false })
    .sort({ updatedAt: -1 })
    .lean();

  if (groups.length === 0) return [];

  // One grouped aggregation rather than a query per group.
  const totals = await GroupExpense.aggregate([
    { $match: { groupId: { $in: groups.map((g) => g._id) } } },
    { $group: { _id: '$groupId', totalSpent: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  const byGroup = new Map(totals.map((t) => [String(t._id), t]));

  return groups.map((group) => {
    const summary = byGroup.get(String(group._id));
    return {
      ...group,
      memberCount: group.members.length,
      expenseCount: summary?.count ?? 0,
      totalSpent: summary?.totalSpent ?? 0,
      // Net balance per group arrives in Phase 7 with the balance engine.
    };
  });
}

export async function getGroup(userId, groupId) {
  const group = await findGroupForUser(userId, groupId);
  const [count, spent] = await Promise.all([
    GroupExpense.countDocuments({ groupId }),
    GroupExpense.aggregate([
      { $match: { groupId: group._id } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return {
    ...group.toObject(),
    expenseCount: count,
    totalSpent: spent[0]?.total ?? 0,
  };
}

/** Only an admin may rename or archive a group. */
function assertAdmin(group, userId) {
  const member = group.memberForUser(userId);
  if (!member || member.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Only a group admin can do that.');
  }
  return member;
}

export async function updateGroup(userId, groupId, data) {
  const group = await findGroupForUser(userId, groupId);
  assertAdmin(group, userId);

  if (data.name !== undefined) group.name = data.name;
  if (data.description !== undefined) group.description = data.description;

  await group.save();
  return group.toObject();
}

/**
 * Archive a group.
 *
 * Never a hard delete: the expense ledger is the record of who owes whom, and
 * destroying it would make outstanding debts unexplainable. Phase 7 adds a
 * refusal when unsettled balances exist.
 */
export async function archiveGroup(userId, groupId) {
  const group = await findGroupForUser(userId, groupId);
  assertAdmin(group, userId);

  group.isArchived = true;
  await group.save();
}

export async function addMember(userId, groupId, input) {
  const group = await findGroupForUser(userId, groupId);
  assertAdmin(group, userId);

  const member = await buildMember(input);

  // Same person twice makes balances meaningless, so block obvious duplicates.
  // Only email can identify someone reliably; two people can share a name.
  if (member.email && group.members.some((m) => m.email === member.email)) {
    throw new ApiError(409, 'DUPLICATE_MEMBER', `${member.name} is already in this group.`, {
      email: 'Already a member',
    });
  }

  group.members.push(member);
  await group.save();
  return group.toObject();
}

export async function updateMember(userId, groupId, memberId, data) {
  const group = await findGroupForUser(userId, groupId);
  assertAdmin(group, userId);

  const member = group.members.id(memberId);
  if (!member) throw new ApiError(404, 'NOT_FOUND', 'Member not found.');

  if (data.name !== undefined) member.name = data.name;
  if (data.phone !== undefined) member.phone = data.phone || null;
  if (data.role !== undefined) member.role = data.role;

  if (data.email !== undefined) {
    const email = data.email?.trim() ? data.email.trim().toLowerCase() : null;
    member.email = email;
    // Adding an email may now link this member to a real account.
    if (email && !member.userId) member.userId = await resolveUserId(email);
  }

  await group.save();
  return group.toObject();
}

/**
 * Remove a member.
 *
 * Refused once they appear in any expense: removing them would leave shares
 * pointing at a member that no longer exists, and the group's balances would
 * stop summing to zero (invariant I2).
 */
export async function removeMember(userId, groupId, memberId) {
  const group = await findGroupForUser(userId, groupId);
  assertAdmin(group, userId);

  const member = group.members.id(memberId);
  if (!member) throw new ApiError(404, 'NOT_FOUND', 'Member not found.');

  if (group.members.length === 1) {
    throw new ApiError(409, 'LAST_MEMBER', 'A group must have at least one member.');
  }

  const involved = await GroupExpense.countDocuments({
    groupId,
    $or: [{ paidBy: memberId }, { 'participants.memberId': memberId }],
  });

  if (involved > 0) {
    throw new ApiError(
      409,
      'MEMBER_HAS_EXPENSES',
      `${member.name} appears in ${involved} expense${involved === 1 ? '' : 's'} and cannot be removed. ` +
        `Delete or reassign those expenses first.`
    );
  }

  group.members.pull(memberId);
  await group.save();
  return group.toObject();
}
