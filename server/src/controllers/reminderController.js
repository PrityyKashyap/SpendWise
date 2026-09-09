import * as reminderService from '../services/reminderService.js';

export async function generate(req, res) {
  const reminder = await reminderService.generateReminder(req.user, req.group, req.body);
  res.status(201).json({ success: true, data: reminder });
}

export async function list(req, res) {
  const reminders = await reminderService.listReminders(req.group, req.validated ?? {});
  res.status(200).json({ success: true, data: reminders });
}
