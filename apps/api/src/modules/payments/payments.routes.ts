import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.get('/', PaymentsController.list);
paymentsRouter.post('/', PaymentsController.create);
paymentsRouter.get('/:id', PaymentsController.getById);

// Staff and Admin payment verification
paymentsRouter.patch('/:id/verify', requireRole('Municipal Staff', 'Administrator'), PaymentsController.verify);

