import * as groupService from '../services/groupService.js';

export async function list(req, res) {
  res.status(200).json({ success: true, data: await groupService.listGroups(req.user._id) });
}

export async function create(req, res) {
  const group = await groupService.createGroup(req.user, req.body);
  res.status(201).json({ success: true, data: group });
}

export async function getOne(req, res) {
  const group = await groupService.getGroup(req.user._id, req.params.groupId);
  res.status(200).json({ success: true, data: group });
}

export async function update(req, res) {
  const group = await groupService.updateGroup(req.user._id, req.params.groupId, req.body);
  res.status(200).json({ success: true, data: group });
}

export async function archive(req, res) {
  await groupService.archiveGroup(req.user._id, req.params.groupId);
  res.status(204).send();
}

export async function addMember(req, res) {
  const group = await groupService.addMember(req.user._id, req.params.groupId, req.body);
  res.status(201).json({ success: true, data: group });
}

export async function updateMember(req, res) {
  const group = await groupService.updateMember(
    req.user._id,
    req.params.groupId,
    req.params.memberId,
    req.body
  );
  res.status(200).json({ success: true, data: group });
}

export async function removeMember(req, res) {
  const group = await groupService.removeMember(
    req.user._id,
    req.params.groupId,
    req.params.memberId
  );
  res.status(200).json({ success: true, data: group });
}
