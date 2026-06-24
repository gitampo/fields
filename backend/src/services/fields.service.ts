import prisma from '../lib/prisma';

export const getAllFields = async () => {
  return prisma.field.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};
