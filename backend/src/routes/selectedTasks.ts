import { Router } from 'express';
import {
  addSelectedTask,
  getSelectedTasks,
  removeSelectedTask,
  updateSelectedTaskOrder,
} from '../controllers/selectedTaskController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

const updateSelectedOrderSchema = z.object({
  body: z.array(
    z.object({
      taskId: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ).min(1),
});

router.get('/', getSelectedTasks);
router.post('/:taskId', addSelectedTask);
router.delete('/:taskId', removeSelectedTask);
router.patch('/order', validate(updateSelectedOrderSchema), updateSelectedTaskOrder);

export default router;

