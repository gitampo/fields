// Auth Routes

import { Router } from 'express';
import { login, me, register, removeMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, me);
router.delete('/me', requireAuth, removeMe);

export default router;

