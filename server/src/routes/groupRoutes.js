import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';
import groupExpenseRoutes from './groupExpenseRoutes.js';
import settlementRoutes from './settlementRoutes.js';
import reminderRoutes from './reminderRoutes.js';
import * as settlementController from '../controllers/settlementController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { authorizeGroupMember } from '../middleware/authorizeGroupMember.js';
import { balancesQuerySchema } from '@spendwise/shared/validators/settlement.js';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateMemberSchema,
} from '@spendwise/shared/validators/group.js';

const router = Router();

router.use(protect);

router.get('/', groupController.list);
router.post('/', validate(createGroupSchema), groupController.create);

// Everything below operates on one group, so membership is checked once here
// rather than in each handler.
router.use('/:groupId', authorizeGroupMember);

router.get('/:groupId', groupController.getOne);
router.patch('/:groupId', validate(updateGroupSchema), groupController.update);
router.delete('/:groupId', groupController.archive);

router.post('/:groupId/members', validate(addMemberSchema), groupController.addMember);
router.patch('/:groupId/members/:memberId', validate(updateMemberSchema), groupController.updateMember);
router.delete('/:groupId/members/:memberId', groupController.removeMember);

router.use('/:groupId/expenses', groupExpenseRoutes);

// Balances are derived on every read (decision D4) — no cache to invalidate.
router.get(
  '/:groupId/balances',
  validate(balancesQuerySchema, 'query'),
  settlementController.balances
);

router.use('/:groupId/settlements', settlementRoutes);
router.use('/:groupId/reminders', reminderRoutes);

export default router;
