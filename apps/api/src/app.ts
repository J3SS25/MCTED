import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { authenticate } from './middleware/auth.js';
import { AppError } from './utils/errors.js';

// Route modules
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { toolsRouter } from './modules/tools/tools.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { rentalsRouter } from './modules/rentals/rentals.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { maintenanceRouter } from './modules/maintenance/maintenance.routes.js';
import { feedbackRouter } from './modules/feedback/feedback.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';

export const app: Express = express();

// Disable x-powered-by
app.disable('x-powered-by');

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);

// CORS
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Request body and cookie parsers
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser(env.SESSION_SECRET));

// Structured logger
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }),
);

// Rate limiting
app.use(globalRateLimiter);

// Authentication parsing
app.use(authenticate);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// Mount Versioned API Routes (/api/v1)
const v1Router = express.Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/tools', toolsRouter);
v1Router.use('/reservations', reservationsRouter);
v1Router.use('/rentals', rentalsRouter);
v1Router.use('/payments', paymentsRouter);
v1Router.use('/maintenance', maintenanceRouter);
v1Router.use('/feedback', feedbackRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/audit', auditRouter);

app.use('/api/v1', v1Router);

// 404 Handler
app.use((req, _res, next) => {
  next(AppError.notFound(`Endpoint not found: ${req.method} ${req.path}`));
});

// Centralized error handler
app.use(errorHandler);

