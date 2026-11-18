import { Router } from 'express';
import { ToolsController } from '../controllers/tools.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const toolsRouter: Router = Router();

// Public catalog listing & item details
toolsRouter.get('/', ToolsController.list);
toolsRouter.get('/verify-serial', ToolsController.verifySerial);
toolsRouter.get('/:id', ToolsController.getById);

// Authenticated inventory management (strictly Municipal Staff and Administrator)
toolsRouter.post(
  '/',
  requireAuth,
  requireRole('Municipal Staff', 'Administrator'),
  ToolsController.create,
);
toolsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('Municipal Staff', 'Administrator'),
  ToolsController.update,
);
toolsRouter.put(
  '/:id',
  requireAuth,
  requireRole('Municipal Staff', 'Administrator'),
  ToolsController.update,
);
toolsRouter.post(
  '/:id/archive',
  requireAuth,
  requireRole('Municipal Staff', 'Administrator'),
  ToolsController.archive,
);
toolsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('Municipal Staff', 'Administrator'),
  ToolsController.remove,
);
