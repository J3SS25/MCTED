import type { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from './maintenance.service.js';
import { CreateMaintenanceSchema, UpdateMaintenanceSchema, MaintenanceStatusSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';

export class MaintenanceController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = req.query.status ? MaintenanceStatusSchema.parse(req.query.status) : undefined;
      const records = MaintenanceService.getAll(status);
      res.json(records);
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Maintenance ID is required');

      const record = MaintenanceService.getById(id);
      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = CreateMaintenanceSchema.parse(req.body);
      const record = MaintenanceService.createReport(
        req.user.id,
        req.user.full_name,
        validated,
      );
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  static update(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Maintenance ID is required');

      const validated = UpdateMaintenanceSchema.parse(req.body);
      const updated = MaintenanceService.updateRecord(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

