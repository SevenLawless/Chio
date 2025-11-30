import { Router } from 'express';
import { getStatsHandler } from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { statsQuerySchema } from '../types/schemas';

const router = Router();

router.use(requireAuth);
router.get('/', validate(statsQuerySchema), getStatsHandler);

export default router;

