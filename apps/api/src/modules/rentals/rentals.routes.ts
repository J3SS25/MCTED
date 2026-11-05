import { Router } from 'express';
import { RentalsController } from './rentals.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const rentalsRouter = Router();

rentalsRouter.use(requireAuth);

rentalsRouter.get('/', RentalsController.list);
rentalsRouter.get('/:id', RentalsController.getById);

// Staff rental desk operations
rentalsRouter.post('/checkout', requireRole('Municipal Staff', 'Administrator'), RentalsController.checkout);
rentalsRouter.post('/:id/return', requireRole('Municipal Staff', 'Administrator'), RentalsController.processReturn);

