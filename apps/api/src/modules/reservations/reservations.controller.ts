import type { Request, Response, NextFunction } from 'express';
import { ReservationsService } from './reservations.service.js';
import { CreateReservationSchema, ReviewReservationSchema, ReservationStatusSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';

export class ReservationsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();

      if (req.user.role === 'Borrower') {
        // IDOR protection: Borrowers strictly receive only their own bookings
        const reservations = ReservationsService.getBorrowerReservations(req.user.id);
        res.json(reservations);
      } else {
        // Staff and Admin can view queue with optional status filter
        const status = req.query.status ? ReservationStatusSchema.parse(req.query.status) : undefined;
        const reservations = ReservationsService.getAllReservations(status);
        res.json(reservations);
      }
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Reservation ID is required');

      const reservation = ReservationsService.getById(id);

      // Borrower IDOR check
      if (req.user.role === 'Borrower' && reservation.user_id !== req.user.id) {
        throw AppError.forbidden('You can only view your own reservation details');
      }

      res.json(reservation);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = CreateReservationSchema.parse(req.body);
      const created = ReservationsService.createReservation(
        req.user.id,
        req.user.full_name,
        validated,
      );
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static review(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Reservation ID is required');

      const validated = ReviewReservationSchema.parse(req.body);
      const updated = ReservationsService.reviewReservation(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static cancel(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Reservation ID is required');

      const updated = ReservationsService.cancelReservation(id, {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

