import { Router } from 'express';
import { RequestsController } from './requests.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const requestsRouter = Router();

requestsRouter.use(requireAuth);

requestsRouter.get('/', RequestsController.list);
requestsRouter.post('/', RequestsController.create);
requestsRouter.get('/:id', RequestsController.getById);
requestsRouter.patch('/:id/status', RequestsController.updateStatus);

