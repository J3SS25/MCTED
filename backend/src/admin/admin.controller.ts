import type { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';

export class AdminController {
  static getDashboardOverview(_req: Request, res: Response, next: NextFunction): void {
    try {
      const stats = AdminService.getOverviewStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  static getSystemHealth(_req: Request, res: Response, next: NextFunction): void {
    try {
      const health = AdminService.getSystemHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  }
}
