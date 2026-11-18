import { Router } from 'express';
import { ReservationsController } from '../controllers/reservations.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const reservationsRouter: Router = Router();

reservationsRouter.get('/', requireAuth, ReservationsController.list);
reservationsRouter.get('/:id', requireAuth, ReservationsController.getById);
reservationsRouter.post('/', requireAuth, ReservationsController.create);
reservationsRouter.patch(
  '/:id/review',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  ReservationsController.review,
);
reservationsRouter.post('/:id/cancel', requireAuth, ReservationsController.cancel);
reservationsRouter.patch('/:id/cancel', requireAuth, ReservationsController.cancel);
