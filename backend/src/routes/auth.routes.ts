// Auth Routes

import { Router } from 'express';
import { login, me, register, removeMe, updateMyNotificationPreferences } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, me);
router.delete('/me', requireAuth, removeMe);
router.patch('/me/notifications', requireAuth, updateMyNotificationPreferences);

export default router;

