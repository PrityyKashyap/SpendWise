import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { analyticsQuerySchema } from '@spendwise/shared/validators/transaction.js';

const router = Router();

router.use(protect);
router.use(validate(analyticsQuerySchema, 'query'));

// GET /api/analytics/trends?months=6  — monthly income/expense/savings series
router.get('/trends', analyticsController.trends);

// GET /api/analytics/daily?month=YYYY-MM  — per-day in/out/net (IDEA.md §22)
router.get('/daily', analyticsController.daily);

// GET /api/analytics/report?month=YYYY-MM — monthly report (IDEA.md §19)
router.get('/report', analyticsController.report);

export default router;
