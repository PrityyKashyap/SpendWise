import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsSchema,
} from '@spendwise/shared/validators/transaction.js';

const router = Router();

router.use(protect);

router.get('/', validate(listTransactionsSchema, 'query'), transactionController.list);
router.post('/', validate(createTransactionSchema), transactionController.create);
router.get('/:id', transactionController.getOne);
router.patch('/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;
