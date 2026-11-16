import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const auditRouter = Router();

// Staff and administrators can review activity/audit logs
auditRouter.get('/', requireAuth, requireRole('Municipal Staff', 'Administrator'), AuditController.getLogs);

