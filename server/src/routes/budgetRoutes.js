import { Router } from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  monthQuerySchema,
} from '@spendwise/shared/validators/budget.js';

const router = Router();

router.use(protect);

router.get('/', validate(monthQuerySchema, 'query'), budgetController.progress);
router.post('/', validate(createBudgetSchema), budgetController.create);
router.patch('/:budgetId', validate(updateBudgetSchema), budgetController.update);
router.delete('/:budgetId', budgetController.remove);

export default router;
