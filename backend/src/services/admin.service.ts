import prisma from '../lib/prisma';

export const getAdminOverview = async () => {
  const now = new Date();

  const [
    totalUsers,
    totalFields,
    totalBookings,
    upcomingBookings,
    activeOpenParties,
    pendingInvites,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.field.count(),
    prisma.booking.count({ where: { status: { not: 'cancelled' } } }),
    prisma.booking.count({
      where: {
        status: { not: 'cancelled' },
        startTime: { gt: now },
      },
    }),
    prisma.party.count({
      where: {
        startTime: { gt: now },
        endTime: { gt: now },
      },
    }),
    prisma.bookingParticipant.count({
      where: {
        status: 'pending',
        booking: {
          status: { not: 'cancelled' },
          endTime: { gt: now },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalFields,
    totalBookings,
    upcomingBookings,
    activeOpenParties,
    pendingInvites,
  };
};
