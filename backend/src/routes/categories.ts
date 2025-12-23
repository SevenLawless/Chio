import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/categoryController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(191, 'Category name must be 191 characters or less'),
    color: z.string().max(191).optional().nullable(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(191).optional(),
    color: z.string().max(191).optional().nullable(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
  params: z.object({
    categoryId: z.string().uuid(),
  }),
});

const deleteCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().uuid(),
  }),
});

router.get('/', listCategories);
router.post('/', validate(createCategorySchema), createCategory);
router.put('/:categoryId', validate(updateCategorySchema), updateCategory);
router.delete('/:categoryId', validate(deleteCategorySchema), deleteCategory);

export default router;

