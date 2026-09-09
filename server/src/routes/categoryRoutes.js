import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '@spendwise/shared/validators/category.js';
import { listCategoriesSchema } from '@spendwise/shared/validators/transaction.js';

const router = Router();

// Every category route requires a session.
router.use(protect);

router.get('/', validate(listCategoriesSchema, 'query'), categoryController.list);
router.post('/', validate(createCategorySchema), categoryController.create);
router.patch('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;
