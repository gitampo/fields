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

type LeaveBookingInput = {
  bookingId: string;
  userId: string;
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

  const booking = await prisma.$transaction(async (tx) => {
    const createdBooking = await tx.booking.create({
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

    const joinedCount = 1 + participantIds.length;
    const partyCapacity = Math.max(createdBooking.field.capacity, 2);
    const hasRemainingSlots = joinedCount < partyCapacity;
    const title = `Hai prenotato: ${createdBooking.field.name}`;

    await tx.party.create({
      data: {
        ownerId: input.ownerId,
        bookingId: createdBooking.id,
        title,
        startTime: input.startTime,
        endTime: input.endTime,
        maxPlayers: partyCapacity,
        isPublic: hasRemainingSlots,
        members: participantIds.length > 0
          ? {
              create: participantIds.map((userId) => ({
                userId,
                isGuest: false,
              })),
            }
          : undefined,
      },
    });

    return createdBooking;
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

  await prisma.$transaction(async (tx) => {
    await tx.party.deleteMany({
      where: { bookingId },
    });

    await tx.booking.delete({ where: { id: bookingId } });
  });

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

  const linkedParty = await prisma.party.findUnique({
    where: { bookingId: input.bookingId },
    select: { id: true, maxPlayers: true },
  });

  if (linkedParty) {
    for (const userId of participantIds) {
      await prisma.partyMember.upsert({
        where: {
          partyId_userId: {
            partyId: linkedParty.id,
            userId,
          },
        },
        update: {},
        create: {
          partyId: linkedParty.id,
          userId,
          isGuest: false,
        },
      });
    }

    const membersCount = await prisma.partyMember.count({
      where: { partyId: linkedParty.id },
    });

    const joinedCount = 1 + membersCount;
    await prisma.party.update({
      where: { id: linkedParty.id },
      data: {
        isPublic: joinedCount < linkedParty.maxPlayers,
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

export const leaveBooking = async (input: LeaveBookingInput) => {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      ownerId: true,
      party: {
        select: {
          id: true,
          maxPlayers: true,
        },
      },
    },
  });

  if (!booking) {
    return { error: 'Booking not found', statusCode: 404 as const };
  }

  if (booking.ownerId === input.userId) {
    return { error: 'Owner cannot leave own booking', statusCode: 400 as const };
  }

  const participant = await prisma.bookingParticipant.findUnique({
    where: {
      bookingId_userId: {
        bookingId: input.bookingId,
        userId: input.userId,
      },
    },
    select: { id: true },
  });

  if (!participant) {
    return { error: 'You are not part of this booking', statusCode: 404 as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingParticipant.delete({
      where: {
        bookingId_userId: {
          bookingId: input.bookingId,
          userId: input.userId,
        },
      },
    });

    if (booking.party) {
      await tx.partyMember.deleteMany({
        where: {
          partyId: booking.party.id,
          userId: input.userId,
        },
      });

      const membersCount = await tx.partyMember.count({
        where: { partyId: booking.party.id },
      });

      const joinedCount = 1 + membersCount;
      await tx.party.update({
        where: { id: booking.party.id },
        data: {
          isPublic: joinedCount < booking.party.maxPlayers,
        },
      });
    }
  });

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
