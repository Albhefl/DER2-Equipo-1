import { PrismaClient } from '@prisma/client';

// Evita crear múltiples instancias de PrismaClient en modo desarrollo
// (tsx watch reinicia el módulo en cada cambio de archivo)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const db =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  global.__prisma = db;
}

export default db;
