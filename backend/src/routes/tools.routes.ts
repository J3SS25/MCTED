import { Router } from 'express';
import { ToolsController } from '../controllers/tools.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const toolsRouter: Router = Router();

// Public catalog listing & item details
toolsRouter.get('/', ToolsController.list);
toolsRouter.get('/:id', ToolsController.getById);

// Authenticated inventory & borrower tool management (ownership enforced in service)
toolsRouter.post('/', requireAuth, ToolsController.create);
toolsRouter.patch('/:id', requireAuth, ToolsController.update);
toolsRouter.put('/:id', requireAuth, ToolsController.update);
toolsRouter.post('/:id/archive', requireAuth, ToolsController.archive);
toolsRouter.delete('/:id', requireAuth, ToolsController.remove);
