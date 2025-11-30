import { Router } from 'express';
import {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  setTaskStateHandler,
  updateTaskHandler,
} from '../controllers/taskController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  deleteTaskSchema,
  setTaskStateSchema,
  taskQuerySchema,
  updateTaskSchema,
} from '../types/schemas';

const router = Router();

router.use(requireAuth);

router.get('/', validate(taskQuerySchema), getTasks);
router.post('/', validate(createTaskSchema), createTaskHandler);
router.put('/:taskId', validate(updateTaskSchema), updateTaskHandler);
router.delete('/:taskId', validate(deleteTaskSchema), deleteTaskHandler);
router.patch('/:taskId/state', validate(setTaskStateSchema), setTaskStateHandler);

export default router;

