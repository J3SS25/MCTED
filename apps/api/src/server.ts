import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';
import db from './db/client.js';

// Run database migrations on startup
try {
  runMigrations();
} catch (error) {
  logger.fatal({ error }, 'Failed to initialize database schema on startup');
  process.exit(1);
}

const server = app.listen(env.PORT, () => {
  logger.info(`MCTEB API server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server and SQLite connection`);
  server.close(() => {
    logger.info('HTTP server closed');
    try {
      db.close();
      logger.info('Database connection closed cleanly');
    } catch (err) {
      logger.error({ err }, 'Error closing database');
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

