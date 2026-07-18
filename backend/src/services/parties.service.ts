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

type DeletePartyInput = {
  partyId: string;
  userId: string;
};

const OPEN_PARTY_JOIN_POINTS = 4;

const normalizePartyTitle = (title: string) => (
  title.replace(/^hai\s+prenotato\s*[:\-]?\s*/i, '').trim()
);

const cleanupStaleParties = async () => {
  const now = new Date();

  const stalePartyIds = await prisma.party.findMany({
    where: {
      OR: [
        { endTime: { lte: now } },
        {
          booking: {
            is: {
              status: 'cancelled',
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (stalePartyIds.length === 0) {
    return;
  }

  await prisma.party.deleteMany({
    where: {
      id: {
        in: stalePartyIds.map((party) => party.id),
      },
    },
  });
};

export const createParty = async (input: CreatePartyInput) => {
  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!booking) {
      return { error: 'Booking not found', statusCode: 404 as const };
    }

    if (booking.ownerId !== input.ownerId) {
      return { error: 'You can only create a party from your own booking', statusCode: 403 as const };
    }

    const acceptedParticipants = await prisma.bookingParticipant.count({
      where: {
        bookingId: input.bookingId,
        status: 'accepted',
      },
    });

    const confirmedParticipants = 1 + acceptedParticipants;
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

  return {
    party: {
      ...party,
      title: normalizePartyTitle(party.title),
    },
  };
};

export const listParties = async (userId?: string) => {
  await cleanupStaleParties();

  const now = new Date();
  const parties = await prisma.party.findMany({
    where: {
      startTime: { gt: now },
      endTime: { gt: now },
      NOT: {
        booking: {
          is: {
            status: 'cancelled',
          },
        },
      },
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
    orderBy: {
      startTime: 'asc',
    },
  });

  return Promise.all(parties.map(async (party) => {
    let isJoinedByMe = false;

    if (userId) {
      if (party.ownerId === userId) {
        isJoinedByMe = true;
      } else if (party.bookingId) {
        const bookingParticipant = await prisma.bookingParticipant.findUnique({
          where: {
            bookingId_userId: {
              bookingId: party.bookingId,
              userId,
            },
          },
          select: { status: true },
        });

        isJoinedByMe = bookingParticipant?.status === 'accepted';
      } else {
        isJoinedByMe = party.members.some((member) => member.userId === userId);
      }
    }

    return {
      ...party,
      title: normalizePartyTitle(party.title),
      joinedCount: 1 + party.members.length,
      remainingSlots: Math.max(party.maxPlayers - (1 + party.members.length), 0),
      isJoinedByMe,
    };
  }));
};

export const joinParty = async (input: JoinPartyInput) => {
  await cleanupStaleParties();

  const party = await prisma.party.findUnique({
    where: { id: input.partyId },
    include: {
      members: true,
      owner: {
        select: { id: true },
      },
      booking: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!party) {
    return { error: 'Party not found', statusCode: 404 as const };
  }

  if (party.endTime <= new Date()) {
    return { error: 'Party is expired', statusCode: 409 as const };
  }

  if (party.startTime <= new Date()) {
    return { error: 'Party already started', statusCode: 409 as const };
  }

  if (party.booking?.status === 'cancelled') {
    return { error: 'Party is no longer available', statusCode: 409 as const };
  }

  if (!party.isPublic && party.ownerId !== input.userId) {
    return { error: 'Private party: join not allowed', statusCode: 403 as const };
  }

  if (party.ownerId === input.userId) {
    return { error: 'Owner is already in the party', statusCode: 409 as const };
  }

  let alreadyJoined = party.members.some((member) => member.userId === input.userId);

  if (party.bookingId) {
    const participant = await prisma.bookingParticipant.findUnique({
      where: {
        bookingId_userId: {
          bookingId: party.bookingId,
          userId: input.userId,
        },
      },
      select: { status: true },
    });

    if (participant?.status === 'accepted') {
      alreadyJoined = true;
    }
  }

  if (alreadyJoined) {
    return { error: 'User already joined this party', statusCode: 409 as const };
  }

  const joinedCount = 1 + party.members.length;
  if (joinedCount >= party.maxPlayers) {
    return { error: 'Party is full', statusCode: 409 as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.partyMember.upsert({
      where: {
        partyId_userId: {
          partyId: input.partyId,
          userId: input.userId,
        },
      },
      update: {
        isGuest: false,
      },
      create: {
        partyId: input.partyId,
        userId: input.userId,
        isGuest: false,
      },
    });

    if (party.bookingId) {
      await tx.bookingParticipant.upsert({
        where: {
          bookingId_userId: {
            bookingId: party.bookingId,
            userId: input.userId,
          },
        },
        update: {
          status: 'accepted',
        },
        create: {
          bookingId: party.bookingId,
          userId: input.userId,
          status: 'accepted',
        },
      });
    }

    const updatedMembersCount = await tx.partyMember.count({
      where: { partyId: input.partyId },
    });

    const updatedJoinedCount = 1 + updatedMembersCount;
    const shouldRemainPublic = updatedJoinedCount < party.maxPlayers;

    await tx.party.update({
      where: { id: input.partyId },
      data: {
        isPublic: shouldRemainPublic ? party.isPublic : false,
      },
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        points: {
          increment: OPEN_PARTY_JOIN_POINTS,
        },
      },
    });

    await tx.pointsLog.create({
      data: {
        userId: input.userId,
        points: OPEN_PARTY_JOIN_POINTS,
        reason: `open_party_join_ingresso:${party.bookingId || input.partyId}`,
      },
    });
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
      title: normalizePartyTitle(updated.title),
      joinedCount: 1 + updated.members.length,
      remainingSlots: Math.max(updated.maxPlayers - (1 + updated.members.length), 0),
    },
  };
};

export const deleteParty = async (input: DeletePartyInput) => {
  const party = await prisma.party.findUnique({
    where: { id: input.partyId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!party) {
    return { error: 'Party not found', statusCode: 404 as const };
  }

  if (party.ownerId !== input.userId) {
    return { error: 'Only party owner can delete this party', statusCode: 403 as const };
  }

  await prisma.party.delete({
    where: { id: input.partyId },
  });

  return { deleted: true };
};
