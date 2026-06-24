import { Response } from 'express';
import { getSocketServer } from '../lib/socket';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createParty, joinParty, listParties } from '../services/parties.service';

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const emitPartiesChanged = () => {
  const io = getSocketServer();
  io?.emit('parties:changed');
};

export const listPartiesHandler = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const parties = await listParties();
    return res.status(200).json(parties);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPartyHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { title, startTime, endTime, isPublic, maxPlayers, bookingId } = req.body as {
    title?: unknown;
    startTime?: unknown;
    endTime?: unknown;
    isPublic?: unknown;
    maxPlayers?: unknown;
    bookingId?: unknown;
  };

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'title is required' });
  }

  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return res.status(400).json({ message: 'startTime and endTime are required' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (start >= end) {
    return res.status(400).json({ message: 'startTime must be before endTime' });
  }

  const parsedMaxPlayers = Number(maxPlayers);
  const normalizedMaxPlayers = Number.isFinite(parsedMaxPlayers) ? Math.trunc(parsedMaxPlayers) : 10;

  if (normalizedMaxPlayers < 2) {
    return res.status(400).json({ message: 'maxPlayers must be at least 2' });
  }

  try {
    const result = await createParty({
      ownerId: req.userId,
      bookingId: typeof bookingId === 'string' && bookingId.trim() ? bookingId.trim() : undefined,
      title: title.trim(),
      startTime: start,
      endTime: end,
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      maxPlayers: normalizedMaxPlayers,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitPartiesChanged();
    return res.status(201).json(result.party);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const joinPartyHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const partyId = req.params.id;
  if (!partyId) {
    return res.status(400).json({ message: 'party id is required' });
  }

  try {
    const result = await joinParty({
      partyId,
      userId: req.userId,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    emitPartiesChanged();
    return res.status(200).json(result.party);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
