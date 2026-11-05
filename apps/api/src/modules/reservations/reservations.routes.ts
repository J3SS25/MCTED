import { Router } from 'express';
import { ReservationsController } from './reservations.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

reservationsRouter.get('/', ReservationsController.list);
reservationsRouter.post('/', ReservationsController.create);
reservationsRouter.get('/:id', ReservationsController.getById);
reservationsRouter.post('/:id/cancel', ReservationsController.cancel);

// Staff review
reservationsRouter.patch('/:id/review', requireRole('Municipal Staff', 'Administrator'), ReservationsController.review);

