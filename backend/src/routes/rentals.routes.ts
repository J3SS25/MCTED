import { Router } from 'express';
import { RentalsController } from '../controllers/rentals.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const rentalsRouter: Router = Router();

rentalsRouter.get('/', requireAuth, RentalsController.list);
rentalsRouter.get('/:id', requireAuth, RentalsController.getById);
rentalsRouter.post(
  '/release',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  RentalsController.release,
);
rentalsRouter.post(
  '/:id/return',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  RentalsController.processReturn,
);
