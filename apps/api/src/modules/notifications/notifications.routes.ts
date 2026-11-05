import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', NotificationsController.list);
notificationsRouter.patch('/:id/read', NotificationsController.markRead);
notificationsRouter.post('/mark-all-read', NotificationsController.markAllRead);

