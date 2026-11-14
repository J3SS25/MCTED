import type { Request, Response, NextFunction } from 'express';
import { HrService } from './hr.service.js';
import { AppError } from '../../utils/errors.js';
import { z } from 'zod';
import { BarangaySchema } from '@mcteb/shared';

const CreateStaffSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  province: z.string().default('Batanes'),
  barangay: BarangaySchema,
  address: z.string().min(5),
  role: z.enum(['Municipal Staff', 'Staff', 'Administrator', 'Admin']).default('Staff'),
  temporaryPassword: z.string().min(8).optional(),
});

export class HrController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      const staff = HrService.getStaffList();
      res.json(staff);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const payload = CreateStaffSchema.parse(req.body);

      const staff = await HrService.onboardStaff(payload, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.status(201).json(staff);
    } catch (error) {
      next(error);
    }
  }

  static updateRole(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      const { role } = req.body;
      if (!role) throw AppError.badRequest('Role is required');

      const updated = HrService.updateStaffRole(id, role, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static decommission(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;

      const updated = HrService.decommissionStaff(id, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

