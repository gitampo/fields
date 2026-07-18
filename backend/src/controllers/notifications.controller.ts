import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notifications.service';

export const listMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const notifications = await listUserNotifications(req.userId);
    return res.status(200).json(notifications);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markMyNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const notificationId = req.params.id;
  if (!notificationId) {
    return res.status(400).json({ message: 'notification id is required' });
  }

  try {
    const updated = await markNotificationAsRead(req.userId, notificationId);
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllMyNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const updatedCount = await markAllNotificationsAsRead(req.userId);
    return res.status(200).json({ updatedCount });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
