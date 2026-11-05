import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

// Staff and Admin maintenance operations
maintenanceRouter.get('/', requireRole('Municipal Staff', 'Administrator'), MaintenanceController.list);
maintenanceRouter.get('/:id', requireRole('Municipal Staff', 'Administrator'), MaintenanceController.getById);
maintenanceRouter.post('/', requireRole('Municipal Staff', 'Administrator'), MaintenanceController.create);
maintenanceRouter.patch('/:id', requireRole('Municipal Staff', 'Administrator'), MaintenanceController.update);

