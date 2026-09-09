import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { dashboardQuerySchema } from '@spendwise/shared/validators/transaction.js';

const router = Router();

router.use(protect);

router.get('/summary', validate(dashboardQuerySchema, 'query'), dashboardController.summary);
router.get('/spending', validate(dashboardQuerySchema, 'query'), dashboardController.spending);
router.get('/recent', validate(dashboardQuerySchema, 'query'), dashboardController.recent);

export default router;
