import { Router } from 'express';
import {
  listMyNotifications,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
} from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, listMyNotifications);
router.patch('/read-all', requireAuth, markAllMyNotificationsAsRead);
router.patch('/:id/read', requireAuth, markMyNotificationAsRead);

export default router;
