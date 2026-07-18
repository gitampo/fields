import prisma from '../lib/prisma';

const emailArg = process.argv[2]?.trim().toLowerCase();

if (!emailArg) {
  console.error('[ADMIN] Uso: npm run admin:grant --workspace=backend -- <email>');
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: emailArg },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error(`[ADMIN] Utente non trovato: ${emailArg}`);
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`[ADMIN] Utente gia admin: ${user.email}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  });

  console.log(`[ADMIN] Ruolo aggiornato a ADMIN per: ${user.email}`);
}

main()
  .catch((error) => {
    console.error('[ADMIN] Errore:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
