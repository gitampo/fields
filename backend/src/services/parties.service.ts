import prisma from '../lib/prisma';

type CreatePartyInput = {
  ownerId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isPublic: boolean;
  maxPlayers: number;
  bookingId?: string;
};

type JoinPartyInput = {
  partyId: string;
  userId: string;
};

export const createParty = async (input: CreatePartyInput) => {
  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        ownerId: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!booking) {
      return { error: 'Booking not found', statusCode: 404 as const };
    }

    if (booking.ownerId !== input.ownerId) {
      return { error: 'You can only create a party from your own booking', statusCode: 403 as const };
    }

    const confirmedParticipants = 1 + booking._count.participants;
    if (confirmedParticipants < input.maxPlayers) {
      return {
        error: `Not enough participants: ${confirmedParticipants}/${input.maxPlayers}`,
        statusCode: 400 as const,
      };
    }
  }

  const party = await prisma.party.create({
    data: {
      ownerId: input.ownerId,
      bookingId: input.bookingId,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      isPublic: input.isPublic,
      maxPlayers: input.maxPlayers,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      booking: {
        include: {
          field: true,
        },
      },
    },
  });

  return { party };
};

export const listParties = async () => {
  const parties = await prisma.party.findMany({
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      booking: {
        include: {
          field: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return parties.map((party) => ({
    ...party,
    joinedCount: 1 + party.members.length,
    remainingSlots: Math.max(party.maxPlayers - (1 + party.members.length), 0),
  }));
};

export const joinParty = async (input: JoinPartyInput) => {
  const party = await prisma.party.findUnique({
    where: { id: input.partyId },
    include: {
      members: true,
      owner: {
        select: { id: true },
      },
    },
  });

  if (!party) {
    return { error: 'Party not found', statusCode: 404 as const };
  }

  if (!party.isPublic && party.ownerId !== input.userId) {
    return { error: 'Private party: join not allowed', statusCode: 403 as const };
  }

  if (party.ownerId === input.userId) {
    return { error: 'Owner is already in the party', statusCode: 409 as const };
  }

  const alreadyJoined = party.members.some((member) => member.userId === input.userId);
  if (alreadyJoined) {
    return { error: 'User already joined this party', statusCode: 409 as const };
  }

  const joinedCount = 1 + party.members.length;
  if (joinedCount >= party.maxPlayers) {
    return { error: 'Party is full', statusCode: 409 as const };
  }

  await prisma.partyMember.create({
    data: {
      partyId: input.partyId,
      userId: input.userId,
      isGuest: false,
    },
  });

  const updated = await prisma.party.findUnique({
    where: { id: input.partyId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      booking: {
        include: {
          field: true,
        },
      },
    },
  });

  if (!updated) {
    return { error: 'Party not found', statusCode: 404 as const };
  }

  return {
    party: {
      ...updated,
      joinedCount: 1 + updated.members.length,
      remainingSlots: Math.max(updated.maxPlayers - (1 + updated.members.length), 0),
    },
  };
};
