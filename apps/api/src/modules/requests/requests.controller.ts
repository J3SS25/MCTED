import type { Request, Response, NextFunction } from 'express';
import { RequestsService } from './requests.service.js';
import { AppError } from '../../utils/errors.js';
import { z } from 'zod';

const CreateBorrowRequestSchema = z.object({
  item_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  request_message: z.string().max(500).optional(),
});

const UpdateRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'returned', 'cancelled']),
});

export class RequestsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const isStaffOrAdmin = ['Administrator', 'Admin', 'Municipal Staff', 'Staff'].includes(req.user.role);
      const items = RequestsService.getRequests(req.user.id, isStaffOrAdmin);
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Request ID is required');

      const record = RequestsService.getById(id);
      const isStaffOrAdmin = ['Administrator', 'Admin', 'Municipal Staff', 'Staff'].includes(req.user.role);
      if (!isStaffOrAdmin && record.borrower_id !== req.user.id && record.lender_id !== req.user.id) {
        throw AppError.forbidden('You do not have access to view this request');
      }

      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const payload = CreateBorrowRequestSchema.parse(req.body);

      const record = RequestsService.createRequest(
        req.user.id,
        req.user.full_name,
        payload,
      );
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Request ID is required');

      const { status } = UpdateRequestStatusSchema.parse(req.body);
      const updated = RequestsService.updateStatus(id, status, {
        id: req.user.id,
        role: req.user.role,
        name: req.user.full_name,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

