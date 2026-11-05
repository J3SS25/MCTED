import { Router } from 'express';
import { ToolsController } from './tools.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const toolsRouter = Router();

// Public catalog access
toolsRouter.get('/', ToolsController.list);
toolsRouter.get('/:id', ToolsController.getById);

// Staff and Admin inventory management
toolsRouter.post('/', requireAuth, requireRole('Municipal Staff', 'Administrator'), ToolsController.create);
toolsRouter.patch('/:id', requireAuth, requireRole('Municipal Staff', 'Administrator'), ToolsController.update);
toolsRouter.post('/:id/archive', requireAuth, requireRole('Municipal Staff', 'Administrator'), ToolsController.archive);

