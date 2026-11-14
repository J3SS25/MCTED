import type { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentSchema, VerifyPaymentSchema, PaymentStatusSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';
import { z } from 'zod';

const MockCheckoutSchema = z.object({
  reservation_id: z.string().uuid().optional(),
  rental_id: z.string().uuid().optional(),
  tool_id: z.string().uuid().optional(),
  amount_centavos: z.number().int().positive(),
  payment_method: z.enum(['GCash', 'Maya', 'PayMaya', 'BDO', 'Landbank', 'LANDBANK', 'Cash', 'Bank Transfer', 'Municipal Treasury']),
  account_number: z.string().optional(),
});

export class PaymentsController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();

      if (req.user.role === 'Borrower') {
        // IDOR check: Borrowers only view their own payments
        const payments = PaymentsService.getBorrowerPayments(req.user.id);
        res.json(payments);
      } else {
        const status = req.query.status ? PaymentStatusSchema.parse(req.query.status) : undefined;
        const payments = PaymentsService.getAllPayments(status);
        res.json(payments);
      }
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Payment ID is required');

      const payment = PaymentsService.getById(id);

      // IDOR check
      if (req.user.role === 'Borrower' && payment.user_id !== req.user.id) {
        throw AppError.forbidden('You can only view your own payment records');
      }

      res.json(payment);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = CreatePaymentSchema.parse(req.body);
      const payment = PaymentsService.recordPayment(
        req.user.id,
        req.user.full_name,
        validated,
      );
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }

  static verify(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Payment ID is required');

      const validated = VerifyPaymentSchema.parse(req.body);
      const payment = PaymentsService.verifyPayment(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(payment);
    } catch (error) {
      next(error);
    }
  }

  static mockCheckout(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const payload = MockCheckoutSchema.parse(req.body);

      const payment = PaymentsService.processMockPayment(
        req.user.id,
        req.user.full_name,
        payload,
      );

      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }

  static getReceipt(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Payment ID is required');

      const receipt = PaymentsService.getReceiptData(id);

      // Authorization check: User can only see own receipt unless staff/admin
      if (
        req.user.role === 'Borrower' &&
        receipt.payer.id !== req.user.id
      ) {
        throw AppError.forbidden('You do not have permission to view this receipt');
      }

      res.json(receipt);
    } catch (error) {
      next(error);
    }
  }
}

