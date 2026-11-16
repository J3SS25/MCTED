import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const maintenanceRouter: Router = Router();

// Staff and Admin maintenance oversight
maintenanceRouter.get(
  '/',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  MaintenanceController.list,
);
maintenanceRouter.get(
  '/:id',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  MaintenanceController.getById,
);
maintenanceRouter.post(
  '/',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  MaintenanceController.create,
);
maintenanceRouter.patch(
  '/:id',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  MaintenanceController.update,
);
