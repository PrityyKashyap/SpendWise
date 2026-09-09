import { Router } from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { monthQuerySchema } from '@spendwise/shared/validators/budget.js';

const router = Router();

// GET /api/insights?month=YYYY-MM — deterministic, computed from the user's
// own transactions (IDEA.md §21).
router.get('/', protect, validate(monthQuerySchema, 'query'), budgetController.insights);

export default router;
