import { Router } from 'express';
import { HrController } from './hr.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const hrRouter = Router();

// Dedicated Human Resources module restricted to Administrators
hrRouter.use(requireAuth, requireRole('Administrator', 'Admin'));

hrRouter.get('/staff', HrController.list);
hrRouter.post('/staff', HrController.create);
hrRouter.patch('/staff/:id/role', HrController.updateRole);
hrRouter.delete('/staff/:id', HrController.decommission);

