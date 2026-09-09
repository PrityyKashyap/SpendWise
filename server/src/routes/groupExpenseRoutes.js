import { Router } from 'express';
import * as groupExpenseController from '../controllers/groupExpenseController.js';
import { validate } from '../middleware/validate.js';
import {
  createGroupExpenseSchema,
  updateGroupExpenseSchema,
  listGroupExpensesSchema,
} from '@spendwise/shared/validators/groupExpense.js';

// mergeParams so :groupId from the parent router is visible here, and
// authorizeGroupMember (applied by the parent) has already attached req.group.
const router = Router({ mergeParams: true });

router.get('/', validate(listGroupExpensesSchema, 'query'), groupExpenseController.list);
router.post('/', validate(createGroupExpenseSchema), groupExpenseController.create);

// Must be declared before '/:expenseId' or "preview" would be read as an id.
router.post('/preview', validate(createGroupExpenseSchema), groupExpenseController.preview);

router.get('/:expenseId', groupExpenseController.getOne);
router.patch('/:expenseId', validate(updateGroupExpenseSchema), groupExpenseController.update);
router.delete('/:expenseId', groupExpenseController.remove);

export default router;
