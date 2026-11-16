import { Router } from 'express';
import { ToolsController } from '../controllers/tools.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const toolsRouter: Router = Router();

// Public catalog listing & item details
toolsRouter.get('/', ToolsController.list);
toolsRouter.get('/:id', ToolsController.getById);

// Staff and Administrator inventory operations
toolsRouter.post(
  '/',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  ToolsController.create,
);
toolsRouter.put(
  '/:id',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  ToolsController.update,
);
toolsRouter.delete('/:id', requireAuth, requireRole('Administrator'), ToolsController.archive);
