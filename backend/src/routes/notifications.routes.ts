import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter: Router = Router();

notificationsRouter.get('/', requireAuth, NotificationsController.list);
notificationsRouter.patch('/mark-all-read', requireAuth, NotificationsController.markAllRead);
notificationsRouter.patch('/:id/read', requireAuth, NotificationsController.markRead);
