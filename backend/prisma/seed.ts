import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seeding...');

  // Clear existing fields
  await prisma.field.deleteMany();
  console.log('[SEED] Cleared existing fields');

  // Create sample fields
  const fields = await prisma.field.createMany({
    data: [
      {
        name: 'Campo da Calcetto',
        sport: 'Calcio',
        capacity: 10,
        pricePerHour: 20,
        isAvailable: true,
      },
      {
        name: 'Campo Bocce',
        sport: 'Bocce',
        capacity: 12,
        pricePerHour: 15,
        isAvailable: true,
      },
      {
        name: 'Campo Tennis',
        sport: 'Tennis',
        capacity: 4,
        pricePerHour: 10,
        isAvailable: true,
      },
      {
        name: 'Campo Padel',
        sport: 'Padel',
        capacity: 4,
        pricePerHour: 10,
        isAvailable: true,
      },
    ],
  });

  console.log(`[SEED] Created ${fields.count} fields`);
  console.log('[SEED] Database seeding completed successfully ✓');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
