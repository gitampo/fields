import { Response } from 'express';
import prisma from '../lib/prisma';
import { getSocketServer } from '../lib/socket';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createNotificationsByPreference } from '../services/notifications.service';
import {
  addBookingParticipants,
  createBooking,
  deleteBooking,
  getMyBookingsHistory,
  getMyCompletedBookingStats,
  getMyPendingInvites,
  getMyBookings,
  leaveBooking,
  respondToBookingInvite,
} from '../services/bookings.service';

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const parseParticipantIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

const isOnFullHour = (date: Date) => (
  date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0
);

const isOnHalfHourSlot = (date: Date) => (
  (date.getMinutes() === 0 || date.getMinutes() === 30)
  && date.getSeconds() === 0
  && date.getMilliseconds() === 0
);

const emitBookingsChanged = () => {
  const io = getSocketServer();
  io?.emit('bookings:changed');
  io?.emit('parties:changed');
};

const formatDateTime = (date: Date) => date.toLocaleString('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const createBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  const { fieldId, startTime, endTime, participantUserIds } = req.body as {
    fieldId?: string;
    startTime?: unknown;
    endTime?: unknown;
    participantUserIds?: unknown;
  };

  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!fieldId || !isValidDate(startTime) || !isValidDate(endTime)) {
    return res.status(400).json({ message: 'fieldId, startTime and endTime are required' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({ message: 'startTime must be before endTime' });
  }

  try {
    const field = await prisma.field.findUnique({ where: { id: fieldId } });

    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    if (!field.isAvailable) {
      return res.status(409).json({ message: 'Field is not available' });
    }

    const isPadel = field.sport.toLowerCase().includes('padel');

    if (isPadel) {
      if (!isOnHalfHourSlot(start) || !isOnHalfHourSlot(end)) {
        return res.status(400).json({ message: 'Padel bookings must use 30-minute slots (for example 09:00-10:30)' });
      }

      const ninetyMinutesMs = 90 * 60 * 1000;
      if (end.getTime() - start.getTime() !== ninetyMinutesMs) {
        return res.status(400).json({ message: 'Padel bookings must be exactly 1 hour and 30 minutes long' });
      }
    } else {
      if (!isOnFullHour(start) || !isOnFullHour(end)) {
        return res.status(400).json({ message: 'Bookings must start and end on full-hour times (for example 17:00-18:00)' });
      }

      const oneHourMs = 60 * 60 * 1000;
      if (end.getTime() - start.getTime() !== oneHourMs) {
        return res.status(400).json({ message: 'Bookings must be exactly 1 hour long' });
      }
    }

    const result = await createBooking({
      fieldId,
      ownerId: req.userId,
      startTime: start,
      endTime: end,
      participantUserIds: parseParticipantIds(participantUserIds),
    });

    if (result.error) {
      const isValidationError = result.error.startsWith('Users not found');
      return res.status(isValidationError ? 400 : 409).json({ message: result.error });
    }

    if (result.booking) {
      const fieldLabel = result.booking.field?.name || 'Un campo';
      const message = `${fieldLabel} e stato prenotato per ${formatDateTime(result.booking.startTime)}.`;
      try {
        await createNotificationsByPreference({
          preference: 'notifyOnFieldBooked',
          message,
          excludeUserId: req.userId,
        });
      } catch (notificationError) {
        console.error('Failed to create booking notifications', notificationError);
      }
    }

    emitBookingsChanged();
    return res.status(201).json(result.booking);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyBookingsHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const bookings = await getMyBookings(req.userId);
    return res.status(200).json(bookings);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyBookingsHistoryHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const bookings = await getMyBookingsHistory(req.userId);
    return res.status(200).json(bookings);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyCompletedBookingStatsHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await getMyCompletedBookingStats(req.userId);
    return res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFieldAvailabilityHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fieldId, date } = req.query as { fieldId?: string; date?: string };
  if (!fieldId || !date) {
    return res.status(400).json({ message: 'fieldId and date are required' });
  }

  try {
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    const dayStart = new Date(`${date}T00:00:00.000`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
      return res.status(400).json({ message: 'Invalid date format, use YYYY-MM-DD' });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        fieldId,
        status: 'confirmed',
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const isPadel = field.sport.toLowerCase().includes('padel');
    const slotStepMinutes = isPadel ? 30 : 60;
    const durationMinutes = isPadel ? 90 : 60;

    const openHour = 8;
    const closeHour = 23;
    const firstStart = new Date(dayStart);
    firstStart.setHours(openHour, 0, 0, 0);
    const closeTime = new Date(dayStart);
    closeTime.setHours(closeHour, 0, 0, 0);

    const availableSlots: string[] = [];
    const cursor = new Date(firstStart);

    while (cursor < closeTime) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      if (slotEnd <= closeTime) {
        const hasOverlap = bookings.some((booking) => booking.startTime < slotEnd && booking.endTime > slotStart);
        if (!hasOverlap) {
          const hh = String(slotStart.getHours()).padStart(2, '0');
          const mm = String(slotStart.getMinutes()).padStart(2, '0');
          availableSlots.push(`${hh}:${mm}`);
        }
      }

      cursor.setMinutes(cursor.getMinutes() + slotStepMinutes);
    }

    return res.status(200).json({
      fieldId,
      date,
      sport: field.sport,
      slotStepMinutes,
      durationMinutes,
      availableSlots,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bookingId = req.params.id;
  if (!bookingId) {
    return res.status(400).json({ message: 'Booking id is required' });
  }

  try {
    const result = await deleteBooking(bookingId, req.userId);
    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitBookingsChanged();
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addBookingParticipantsHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bookingId = req.params.id;
  const participantUserIds = parseParticipantIds((req.body as { participantUserIds?: unknown }).participantUserIds);

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking id is required' });
  }

  if (participantUserIds.length === 0) {
    return res.status(400).json({ message: 'participantUserIds is required' });
  }

  try {
    const result = await addBookingParticipants({
      bookingId,
      ownerId: req.userId,
      participantUserIds,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitBookingsChanged();
    return res.status(200).json(result.booking);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const leaveBookingHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bookingId = req.params.id;
  if (!bookingId) {
    return res.status(400).json({ message: 'Booking id is required' });
  }

  try {
    const result = await leaveBooking({
      bookingId,
      userId: req.userId,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitBookingsChanged();
    return res.status(200).json(result.booking);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyPendingInvitesHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const invites = await getMyPendingInvites(req.userId);
    return res.status(200).json(invites);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const respondToBookingInviteHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bookingId = req.params.id;
  const { action } = req.body as { action?: unknown };

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking id is required' });
  }

  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ message: 'action must be accept or reject' });
  }

  try {
    const result = await respondToBookingInvite({
      bookingId,
      userId: req.userId,
      action,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitBookingsChanged();
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
