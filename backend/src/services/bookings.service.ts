import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

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

type RespondToBookingInviteInput = {
  bookingId: string;
  userId: string;
  action: 'accept' | 'reject';
};

const BOOKING_OWNER_POINTS = 10;
const OPEN_PARTY_JOIN_POINTS = 4;
const BOOKING_INVITE_ACCEPT_POINTS = 4;

const decrementUserPoints = async (tx: Prisma.TransactionClient, userId: string, pointsToRemove: number) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user) {
    return;
  }

  await tx.user.update({
    where: { id: userId },
    data: {
      points: Math.max(user.points - pointsToRemove, 0),
    },
  });
};

const revokePointsByReason = async (
  tx: Prisma.TransactionClient,
  userId: string,
  pointsToRemove: number,
  reasons: string[],
) => {
  const log = await tx.pointsLog.findFirst({
    where: {
      userId,
      reason: {
        in: reasons,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  });

  if (!log) {
    return false;
  }

  await decrementUserPoints(tx, userId, pointsToRemove);
  await tx.pointsLog.delete({ where: { id: log.id } });
  return true;
};

const normalizeParticipantIdentifiers = (identifiers: string[]) => (
  Array.from(
    new Set(
      identifiers
        .map((identifier) => identifier.trim())
        .filter(Boolean),
    ),
  )
);

const resolveParticipantUserIds = async (identifiers: string[], ownerId: string) => {
  const normalized = normalizeParticipantIdentifiers(identifiers);
  if (normalized.length === 0) {
    return { userIds: [] as string[], missingIdentifiers: [] as string[] };
  }

  const loweredIdentifiers = normalized.map((identifier) => identifier.toLowerCase());
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: normalized } },
        { username: { in: loweredIdentifiers } },
        { email: { in: loweredIdentifiers } },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  const byIdentifier = new Map<string, string>();
  for (const user of users) {
    byIdentifier.set(user.id, user.id);
    byIdentifier.set(user.username.toLowerCase(), user.id);
    byIdentifier.set(user.email.toLowerCase(), user.id);
  }

  const missingIdentifiers = normalized.filter((identifier) => !byIdentifier.has(identifier.toLowerCase()) && !byIdentifier.has(identifier));
  const resolved = normalized
    .map((identifier) => byIdentifier.get(identifier) || byIdentifier.get(identifier.toLowerCase()))
    .filter((value): value is string => Boolean(value))
    .filter((userId) => userId !== ownerId);

  return {
    userIds: Array.from(new Set(resolved)),
    missingIdentifiers,
  };
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

  const { userIds: participantIds, missingIdentifiers } = await resolveParticipantUserIds(
    input.participantUserIds || [],
    input.ownerId,
  );
  if (missingIdentifiers.length > 0) {
    return { error: `Users not found (id/username/email): ${missingIdentifiers.join(', ')}` };
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
              create: participantIds.map((userId) => ({
                userId,
                status: 'pending',
              })),
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

    const joinedCount = 1;
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

    await tx.user.update({
      where: { id: input.ownerId },
      data: {
        points: {
          increment: BOOKING_OWNER_POINTS,
        },
      },
    });

    await tx.pointsLog.create({
      data: {
        userId: input.ownerId,
        points: BOOKING_OWNER_POINTS,
        reason: `booking_created:${createdBooking.id}`,
      },
    });

    return createdBooking;
  });

  return { booking };
};

export const getMyBookings = async (userId: string) => {
  const oneHourAfterEndVisibility = new Date(Date.now() - (60 * 60 * 1000));

  const bookings = await prisma.booking.findMany({
    where: {
      status: {
        not: 'cancelled',
      },
      endTime: {
        gt: oneHourAfterEndVisibility,
      },
      OR: [
        { ownerId: userId },
        { participants: { some: { userId, status: 'accepted' } } },
      ],
    },
    include: {
      field: true,
      participants: {
        where: {
          status: 'accepted',
        },
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

  return bookings.map((booking) => ({
    ...booking,
    bookingRole: booking.ownerId === userId ? 'owner' : 'participant',
  }));
};

export const getMyBookingsHistory = async (userId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { participants: { some: { userId, status: 'accepted' } } },
      ],
    },
    include: {
      field: true,
      participants: {
        where: {
          status: 'accepted',
        },
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
      endTime: 'desc',
    },
  });

  return bookings.map((booking) => ({
    ...booking,
    bookingRole: booking.ownerId === userId ? 'owner' : 'participant',
  }));
};

export const getMyCompletedBookingStats = async (userId: string) => {
  const completedBookings = await prisma.booking.findMany({
    where: {
      status: {
        not: 'cancelled',
      },
      endTime: {
        lte: new Date(),
      },
      OR: [
        { ownerId: userId },
        { participants: { some: { userId, status: 'accepted' } } },
      ],
    },
    select: {
      fieldId: true,
      ownerId: true,
      field: {
        select: {
          id: true,
          name: true,
          sport: true,
        },
      },
    },
  });

  const byFieldMap = new Map<string, {
    fieldId: string;
    fieldName: string;
    sport: string;
    completedBookings: number;
    completedEntries: number;
    totalCompletedActivities: number;
  }>();

  for (const booking of completedBookings) {
    const isOwnerBooking = booking.ownerId === userId;
    const previous = byFieldMap.get(booking.fieldId);
    if (previous) {
      if (isOwnerBooking) {
        previous.completedBookings += 1;
      } else {
        previous.completedEntries += 1;
      }
      previous.totalCompletedActivities += 1;
      continue;
    }

    byFieldMap.set(booking.fieldId, {
      fieldId: booking.fieldId,
      fieldName: booking.field.name,
      sport: booking.field.sport,
      completedBookings: isOwnerBooking ? 1 : 0,
      completedEntries: isOwnerBooking ? 0 : 1,
      totalCompletedActivities: 1,
    });
  }

  const byField = Array.from(byFieldMap.values()).sort((a, b) => (
    b.totalCompletedActivities - a.totalCompletedActivities
  ));

  const totalCompletedBookings = completedBookings.filter((booking) => booking.ownerId === userId).length;
  const totalCompletedEntries = completedBookings.length - totalCompletedBookings;

  return {
    totalCompletedActivities: completedBookings.length,
    totalCompletedBookings,
    totalCompletedEntries,
    byField,
  };
};

export const getMyPendingInvites = async (userId: string) => {
  const oneHourAfterEndVisibility = new Date(Date.now() - (60 * 60 * 1000));

  const invites = await prisma.bookingParticipant.findMany({
    where: {
      userId,
      status: 'pending',
      booking: {
        status: {
          not: 'cancelled',
        },
        endTime: {
          gt: oneHourAfterEndVisibility,
        },
      },
    },
    include: {
      booking: {
        include: {
          field: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          participants: {
            where: {
              status: 'accepted',
            },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return invites.map((invite) => ({
    inviteId: invite.id,
    status: invite.status,
    invitedAt: invite.createdAt,
    booking: {
      ...invite.booking,
      bookingRole: 'invitee' as const,
    },
  }));
};

export const deleteBooking = async (bookingId: string, userId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, ownerId: true, status: true, startTime: true },
  });

  if (!booking) {
    return { error: 'Booking not found', statusCode: 404 as const };
  }

  if (booking.ownerId !== userId) {
    return { error: 'You can only delete your own bookings', statusCode: 403 as const };
  }

  const tenMinutesBeforeStart = new Date(booking.startTime.getTime() - (10 * 60 * 1000));
  if (new Date() >= tenMinutesBeforeStart) {
    return {
      error: 'Booking cannot be deleted from 10 minutes before start time',
      statusCode: 403 as const,
    };
  }

  if (booking.status === 'cancelled') {
    return { deleted: true };
  }

  await prisma.$transaction(async (tx) => {
    const participantEntries = await tx.bookingParticipant.findMany({
      where: { bookingId },
      select: { userId: true },
    });

    await tx.party.deleteMany({
      where: { bookingId },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
      },
    });

    await revokePointsByReason(tx, userId, BOOKING_OWNER_POINTS, [
      `booking_created:${bookingId}`,
    ]);

    for (const participant of participantEntries) {
      await revokePointsByReason(tx, participant.userId, OPEN_PARTY_JOIN_POINTS, [
        `open_party_join_ingresso:${bookingId}`,
        `booking_invite_accepted:${bookingId}`,
      ]);
    }
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

  const { userIds: participantIds, missingIdentifiers } = await resolveParticipantUserIds(
    input.participantUserIds,
    input.ownerId,
  );
  if (missingIdentifiers.length > 0) {
    return { error: `Users not found (id/username/email): ${missingIdentifiers.join(', ')}`, statusCode: 400 as const };
  }

  const existingParticipants = await prisma.bookingParticipant.findMany({
    where: {
      bookingId: input.bookingId,
      userId: {
        in: participantIds,
      },
    },
    select: {
      userId: true,
      status: true,
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  });

  const alreadyInBooking = existingParticipants.filter((participant) => (
    participant.status === 'accepted' || participant.status === 'pending'
  ));

  if (alreadyInBooking.length > 0) {
    const duplicateUsers = alreadyInBooking.map((participant) => participant.user.username || participant.user.email);
    return {
      error: `Utenti gia nella partita o gia invitati: ${duplicateUsers.join(', ')}`,
      statusCode: 409 as const,
    };
  }

  const linkedParty = await prisma.party.findUnique({
    where: { bookingId: input.bookingId },
    select: { id: true },
  });

  if (linkedParty) {
    const partyMembers = await prisma.partyMember.findMany({
      where: {
        partyId: linkedParty.id,
        userId: {
          in: participantIds,
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    const participantUserIds = new Set(existingParticipants.map((participant) => participant.userId));
    const alreadyInPartyOnly = partyMembers.filter((member) => Boolean(member.userId) && !participantUserIds.has(member.userId as string));

    if (alreadyInPartyOnly.length > 0) {
      const duplicateUsers = alreadyInPartyOnly.map((member) => member.user?.username || member.user?.email || member.userId || 'utente');
      return {
        error: `Utenti gia nella partita: ${duplicateUsers.join(', ')}`,
        statusCode: 409 as const,
      };
    }
  }

  const existingByUserId = new Map(existingParticipants.map((participant) => [participant.userId, participant]));

  for (const userId of participantIds) {
    const existing = existingByUserId.get(userId);

    if (!existing) {
      await prisma.bookingParticipant.create({
        data: {
          bookingId: input.bookingId,
          userId,
          status: 'pending',
        },
      });
      continue;
    }

    if (existing.status === 'rejected') {
      await prisma.bookingParticipant.update({
        where: {
          bookingId_userId: {
            bookingId: input.bookingId,
            userId,
          },
        },
        data: { status: 'pending' },
      });
    }
  }

  const updated = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      field: true,
      participants: {
        where: {
          status: 'accepted',
        },
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
    select: { id: true, status: true },
  });

  if (!participant) {
    return { error: 'You are not part of this booking', statusCode: 404 as const };
  }

  if (participant.status !== 'accepted') {
    return { error: 'Invite is pending, respond before leaving', statusCode: 400 as const };
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

    await revokePointsByReason(tx, input.userId, OPEN_PARTY_JOIN_POINTS, [
      `open_party_join_ingresso:${input.bookingId}`,
      `booking_invite_accepted:${input.bookingId}`,
    ]);
  });

  const updated = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      field: true,
      participants: {
        where: {
          status: 'accepted',
        },
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

export const respondToBookingInvite = async (input: RespondToBookingInviteInput) => {
  const invite = await prisma.bookingParticipant.findUnique({
    where: {
      bookingId_userId: {
        bookingId: input.bookingId,
        userId: input.userId,
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          ownerId: true,
          status: true,
          startTime: true,
          endTime: true,
          party: {
            select: {
              id: true,
              maxPlayers: true,
              isPublic: true,
            },
          },
        },
      },
    },
  });

  if (!invite || invite.status !== 'pending') {
    return { error: 'Invite not found', statusCode: 404 as const };
  }

  if (invite.booking.ownerId === input.userId) {
    return { error: 'Owner cannot respond to own invite', statusCode: 400 as const };
  }

  if (invite.booking.status === 'cancelled') {
    return { error: 'Booking is no longer available', statusCode: 409 as const };
  }

  if (invite.booking.endTime <= new Date()) {
    return { error: 'Booking invite is expired', statusCode: 409 as const };
  }

  if (input.action === 'reject') {
    await prisma.bookingParticipant.update({
      where: { id: invite.id },
      data: { status: 'rejected' },
    });

    return { success: true as const };
  }

  if (invite.booking.party) {
    const membersCount = await prisma.partyMember.count({
      where: { partyId: invite.booking.party.id },
    });

    const joinedCount = 1 + membersCount;
    if (joinedCount >= invite.booking.party.maxPlayers) {
      return { error: 'Party is full', statusCode: 409 as const };
    }
  }

  const accepted = await prisma.$transaction(async (tx) => {
    await tx.bookingParticipant.update({
      where: { id: invite.id },
      data: { status: 'accepted' },
    });

    if (invite.booking.party) {
      await tx.partyMember.upsert({
        where: {
          partyId_userId: {
            partyId: invite.booking.party.id,
            userId: input.userId,
          },
        },
        update: {},
        create: {
          partyId: invite.booking.party.id,
          userId: input.userId,
          isGuest: false,
        },
      });

      const updatedMembersCount = await tx.partyMember.count({
        where: { partyId: invite.booking.party.id },
      });

      const updatedJoinedCount = 1 + updatedMembersCount;
      await tx.party.update({
        where: { id: invite.booking.party.id },
        data: {
          isPublic: updatedJoinedCount < invite.booking.party.maxPlayers,
        },
      });
    }

    await tx.user.update({
      where: { id: input.userId },
      data: {
        points: {
          increment: BOOKING_INVITE_ACCEPT_POINTS,
        },
      },
    });

    await tx.pointsLog.create({
      data: {
        userId: input.userId,
        points: BOOKING_INVITE_ACCEPT_POINTS,
        reason: `booking_invite_accepted:${input.bookingId}`,
      },
    });

    return { success: true as const };
  });

  return accepted;
};
