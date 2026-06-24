import prisma from '../lib/prisma';

type CreateBookingInput = {
  fieldId: string;
  ownerId: string;
  startTime: Date;
  endTime: Date;
  participantUserIds?: string[];
};

type AddParticipantsInput = {
  bookingId: string;
  ownerId: string;
  participantUserIds: string[];
};

const normalizeParticipantIds = (ids: string[], ownerId: string) => (
  Array.from(
    new Set(
      ids
        .map((id) => id.trim())
        .filter((id) => Boolean(id) && id !== ownerId),
    ),
  )
);

const getMissingUserIds = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  const found = new Set(users.map((user) => user.id));
  return userIds.filter((id) => !found.has(id));
};

export const createBooking = async (input: CreateBookingInput) => {
  const overlapping = await prisma.booking.findFirst({
    where: {
      fieldId: input.fieldId,
      status: 'confirmed',
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
  });

  if (overlapping) {
    return { error: 'Field is already booked in that time slot' };
  }

  const participantIds = normalizeParticipantIds(input.participantUserIds || [], input.ownerId);
  const missingUsers = await getMissingUserIds(participantIds);
  if (missingUsers.length > 0) {
    return { error: `User IDs not found: ${missingUsers.join(', ')}` };
  }

  const booking = await prisma.booking.create({
    data: {
      fieldId: input.fieldId,
      ownerId: input.ownerId,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'confirmed',
      participants: participantIds.length > 0
        ? {
            create: participantIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
    include: {
      field: true,
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return { booking };
};

export const getMyBookings = async (userId: string) => {
  return prisma.booking.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      field: true,
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
};

export const deleteBooking = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, ownerId: true },
  });

  if (!booking) {
    return { error: 'Booking not found', statusCode: 404 as const };
  }

  if (booking.ownerId !== userId) {
    return { error: 'You can only delete your own bookings', statusCode: 403 as const };
  }

  await prisma.booking.delete({ where: { id: bookingId } });
  return { deleted: true };
};

export const addBookingParticipants = async (input: AddParticipantsInput) => {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: { id: true, ownerId: true },
  });

  if (!booking) {
    return { error: 'Booking not found', statusCode: 404 as const };
  }

  if (booking.ownerId !== input.ownerId) {
    return { error: 'Only booking owner can add participants', statusCode: 403 as const };
  }

  const participantIds = normalizeParticipantIds(input.participantUserIds, input.ownerId);
  const missingUsers = await getMissingUserIds(participantIds);
  if (missingUsers.length > 0) {
    return { error: `User IDs not found: ${missingUsers.join(', ')}`, statusCode: 400 as const };
  }

  for (const userId of participantIds) {
    await prisma.bookingParticipant.upsert({
      where: {
        bookingId_userId: {
          bookingId: input.bookingId,
          userId,
        },
      },
      update: {},
      create: {
        bookingId: input.bookingId,
        userId,
      },
    });
  }

  const updated = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      field: true,
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return { booking: updated };
};
