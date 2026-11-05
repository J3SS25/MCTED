import type { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { AuditLogFilterSchema } from '@mcteb/shared';

export class AuditController {
  static getLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters = AuditLogFilterSchema.parse(req.query);
      const result = AuditService.getLogs(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

