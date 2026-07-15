import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('12345678', 10);

  const student = await prisma.user.upsert({
    where: { email: 'albhefl@gmail.com' },
    update: {},
    create: {
      email: 'albhefl@gmail.com',
      name: 'Alberto',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const evaluator = await prisma.user.upsert({
    where: { email: 'evaluador@classboard.com' },
    update: {},
    create: {
      email: 'evaluador@classboard.com',
      name: 'Evaluador Demo',
      passwordHash,
      role: Role.EVALUATOR,
    },
  });

  console.log('Seed completado:', { student: student.email, evaluator: evaluator.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
