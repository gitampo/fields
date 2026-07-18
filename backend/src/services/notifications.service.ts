import prisma from '../lib/prisma';
import { emitToUser } from '../lib/socket';

type NotificationPreferenceKey = 'notifyOnFieldBooked' | 'notifyOnOpenParty';

type CreatePreferenceNotificationsInput = {
  preference: NotificationPreferenceKey;
  message: string;
  excludeUserId?: string;
};

export const listUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count > 0;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
};

const createAndEmitNotification = async (userId: string, message: string) => {
  const created = await prisma.notification.create({
    data: {
      userId,
      message,
      isRead: false,
    },
  });

  emitToUser(userId, 'notifications:new', created);
  return created;
};

export const createNotificationsByPreference = async (input: CreatePreferenceNotificationsInput) => {
  const recipients = await prisma.user.findMany({
    where: {
      ...(input.excludeUserId ? { id: { not: input.excludeUserId } } : {}),
      [input.preference]: true,
    },
    select: {
      id: true,
    },
  });

  for (const recipient of recipients) {
    await createAndEmitNotification(recipient.id, input.message);
  }

  return recipients.length;
};
