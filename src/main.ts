import { startServer } from './infrastructure/http/server';
import { disconnectPrisma } from './infrastructure/database/prismaClient';
import { logger } from './infrastructure/logging/logger';

const main = async () => {
  try {
    await startServer();
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

main();
