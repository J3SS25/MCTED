import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const auditRouter = Router();

// Only administrators can review audit logs
auditRouter.get('/', requireAuth, requireRole('Administrator'), AuditController.getLogs);

