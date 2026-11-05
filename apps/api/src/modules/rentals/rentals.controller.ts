import type { Request, Response, NextFunction } from 'express';
import { RentalsService } from './rentals.service.js';
import { CheckoutRentalSchema, ReturnRentalSchema, RentalStatusSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';

export class RentalsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();

      if (req.user.role === 'Borrower') {
        // IDOR check: Borrowers only view their own loans
        const rentals = RentalsService.getBorrowerRentals(req.user.id);
        res.json(rentals);
      } else {
        const status = req.query.status ? RentalStatusSchema.parse(req.query.status) : undefined;
        const rentals = RentalsService.getAllRentals(status);
        res.json(rentals);
      }
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Rental ID is required');

      const rental = RentalsService.getById(id);

      // IDOR check: Borrowers only view their own loan
      if (req.user.role === 'Borrower' && rental.user_id !== req.user.id) {
        throw AppError.forbidden('You can only view your own rental details');
      }

      res.json(rental);
    } catch (error) {
      next(error);
    }
  }

  static checkout(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = CheckoutRentalSchema.parse(req.body);
      const rental = RentalsService.checkout(validated, {
        id: req.user.id,
        name: req.user.full_name,
      });
      res.status(201).json(rental);
    } catch (error) {
      next(error);
    }
  }

  static processReturn(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Rental ID is required');

      const validated = ReturnRentalSchema.parse(req.body);
      const rental = RentalsService.processReturn(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });
      res.json(rental);
    } catch (error) {
      next(error);
    }
  }
}

