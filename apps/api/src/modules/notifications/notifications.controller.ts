import type { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import { AppError } from '../../utils/errors.js';

export class NotificationsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const items = NotificationsService.getForUser(req.user.id);
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  static markRead(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Notification ID required');

      const updated = NotificationsService.markRead(id, req.user.id);
      if (!updated) {
        throw AppError.notFound('Notification not found');
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static markAllRead(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const count = NotificationsService.markAllRead(req.user.id);
      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  }
}

