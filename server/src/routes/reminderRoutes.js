import { Router } from 'express';
import * as reminderController from '../controllers/reminderController.js';
import { validate } from '../middleware/validate.js';
import {
  generateReminderSchema,
  listRemindersSchema,
} from '@spendwise/shared/validators/reminder.js';

// mergeParams: :groupId from the parent router; req.group already attached.
const router = Router({ mergeParams: true });

router.get('/', validate(listRemindersSchema, 'query'), reminderController.list);
router.post('/', validate(generateReminderSchema), reminderController.generate);

export default router;
