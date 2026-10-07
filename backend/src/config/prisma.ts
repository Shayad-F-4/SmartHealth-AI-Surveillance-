import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  // Connection pooling for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Enable connection pooling in production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().then(() => {
    console.log('[Prisma] Connected to database with connection pooling');
  }).catch((err) => {
    console.error('[Prisma] Failed to connect:', err);
  });
}

export default prisma;
