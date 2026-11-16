import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { usersRouter } from './users.routes.js';
import { toolsRouter } from './tools.routes.js';
import { reservationsRouter } from './reservations.routes.js';
import { rentalsRouter } from './rentals.routes.js';
import { paymentsRouter } from './payments.routes.js';
import { maintenanceRouter } from './maintenance.routes.js';
import { feedbackRouter } from './feedback.routes.js';
import { notificationsRouter } from './notifications.routes.js';
import { auditRouter } from './audit.routes.js';
import { adminRouter } from '../admin/admin.routes.js';

export const v1Router: Router = Router();

// Domain feature routes
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

// Isolated Administrative Interface
v1Router.use('/admin', adminRouter);

export * from './auth.routes.js';
export * from './users.routes.js';
export * from './tools.routes.js';
export * from './reservations.routes.js';
export * from './rentals.routes.js';
export * from './payments.routes.js';
export * from './maintenance.routes.js';
export * from './feedback.routes.js';
export * from './notifications.routes.js';
export * from './audit.routes.js';
