import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authSchema } from '../types/schemas';

const router = Router();

router.post('/register', validate(authSchema), register);
router.post('/login', validate(authSchema), login);

export default router;

