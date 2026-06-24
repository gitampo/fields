import { Response } from 'express';
import prisma from '../lib/prisma';
import { getSocketServer } from '../lib/socket';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  addBookingParticipants,
  createBooking,
  deleteBooking,
  getMyBookings,
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

const emitBookingsChanged = () => {
  const io = getSocketServer();
  io?.emit('bookings:changed');
};

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

    const result = await createBooking({
      fieldId,
      ownerId: req.userId,
      startTime: start,
      endTime: end,
      participantUserIds: parseParticipantIds(participantUserIds),
    });

    if (result.error) {
      const isValidationError = result.error.startsWith('User IDs not found');
      return res.status(isValidationError ? 400 : 409).json({ message: result.error });
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
