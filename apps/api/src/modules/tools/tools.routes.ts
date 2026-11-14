import { Router } from 'express';
import { ToolsController } from './tools.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const toolsRouter = Router();

// Public catalog access
toolsRouter.get('/', ToolsController.list);
toolsRouter.get('/:id', ToolsController.getById);

// Tool / Equipment listings (Borrowers, Lenders, Staff, and Admins can create)
toolsRouter.post('/', requireAuth, ToolsController.create);
toolsRouter.patch('/:id', requireAuth, ToolsController.update);
toolsRouter.delete('/:id', requireAuth, ToolsController.delete);
toolsRouter.post('/:id/archive', requireAuth, requireRole('Municipal Staff', 'Staff', 'Administrator', 'Admin'), ToolsController.archive);

