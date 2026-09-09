import { Router } from 'express';
import * as settlementController from '../controllers/settlementController.js';
import { validate } from '../middleware/validate.js';
import {
  createSettlementSchema,
  listSettlementsSchema,
} from '@spendwise/shared/validators/settlement.js';

// mergeParams: :groupId comes from the parent router, and authorizeGroupMember
// has already attached req.group.
const router = Router({ mergeParams: true });

router.get('/', validate(listSettlementsSchema, 'query'), settlementController.list);
router.post('/', validate(createSettlementSchema), settlementController.create);
router.patch('/:settlementId/cancel', settlementController.cancel);

export default router;
