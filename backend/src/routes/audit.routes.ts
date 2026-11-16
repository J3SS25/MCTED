import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const auditRouter: Router = Router();

// Immutable security audit logs: Strictly Administrator only
auditRouter.get('/', requireAuth, requireRole('Administrator'), AuditController.getLogs);
