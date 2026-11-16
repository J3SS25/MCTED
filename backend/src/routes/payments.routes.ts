import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const paymentsRouter: Router = Router();

paymentsRouter.get('/', requireAuth, PaymentsController.list);
paymentsRouter.get('/:id', requireAuth, PaymentsController.getById);
paymentsRouter.post('/', requireAuth, PaymentsController.create);
paymentsRouter.patch(
  '/:id/verify',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  PaymentsController.verify,
);
