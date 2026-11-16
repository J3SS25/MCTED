import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { UsersController } from '../controllers/users.controller.js';
import { AuditController } from '../controllers/audit.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter: Router = Router();

// Strict Administrative Perimeter: All routes in /admin require authenticated Administrator
adminRouter.use(requireAuth, requireRole('Administrator'));

// Overview & Diagnostics
adminRouter.get('/overview', AdminController.getDashboardOverview);
adminRouter.get('/health', AdminController.getSystemHealth);

// Administrative User Management
adminRouter.get('/users', UsersController.list);
adminRouter.patch('/users/:id/status', UsersController.updateStatus);
adminRouter.patch('/users/:id/role', UsersController.updateRole);

// Administrative Audit Trail Inspection
adminRouter.get('/audit', AuditController.getLogs);
