import { PaymentsRepository, type PaymentWithDetails } from './payments.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';
import type { CreatePaymentInput, VerifyPaymentInput, PaymentStatus } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';
import db from '../../db/client.js';

export class PaymentsService {
  static getById(id: string): PaymentWithDetails {
    const payment = PaymentsRepository.findById(id);
    if (!payment) {
      throw AppError.notFound('Payment record not found');
    }
    return payment;
  }

  static getBorrowerPayments(userId: string): PaymentWithDetails[] {
    return PaymentsRepository.findByUserId(userId);
  }

  static getAllPayments(status?: PaymentStatus): PaymentWithDetails[] {
    return PaymentsRepository.findAll(status);
  }

  static recordPayment(
    userId: string,
    payerName: string,
    input: CreatePaymentInput,
  ): PaymentWithDetails {
    const receiptRef = PaymentsRepository.generateReceiptReference();

    const paymentTx = db.transaction(() => {
      const payment = PaymentsRepository.create(userId, input, receiptRef);

      AuditService.record({
        actor_id: userId,
        actor_name: payerName,
        action: 'PAYMENT_SUBMITTED',
        target_type: 'payment',
        target_id: payment.id,
        details: `Submitted payment of ${formatPHP(input.amount_centavos)} via ${input.payment_method}. Ref: ${receiptRef}`,
      });

      NotificationsService.create({
        user_id: userId,
        title: 'Payment Submitted',
        message: `Your payment of ${formatPHP(input.amount_centavos)} (Ref: ${receiptRef}) has been submitted for municipal treasury verification.`,
        type: 'info',
        link_url: `/payments/${payment.id}`,
      });

      return payment;
    });

    const res = paymentTx();
    return this.getById(res.id);
  }

  static verifyPayment(
    id: string,
    input: VerifyPaymentInput,
    verifier: { id: string; name: string },
  ): PaymentWithDetails {
    const payment = this.getById(id);
    if (payment.status !== 'Pending') {
      throw AppError.badRequest(`Cannot verify payment with status "${payment.status}"`);
    }

    const verifyTx = db.transaction(() => {
      const updated = PaymentsRepository.verify(id, input, verifier.id);
      if (!updated) {
        throw AppError.internal('Failed to update payment status');
      }

      AuditService.record({
        actor_id: verifier.id,
        actor_name: verifier.name,
        action: input.status === 'Paid' ? 'PAYMENT_VERIFIED' : 'PAYMENT_DECLINED',
        target_type: 'payment',
        target_id: id,
        details: `${input.status} payment ${payment.receipt_reference}. Notes: ${input.notes || 'None'}`,
      });

      NotificationsService.create({
        user_id: payment.user_id,
        title: `Payment ${input.status === 'Paid' ? 'Verified' : 'Status Update'}`,
        message:
          input.status === 'Paid'
            ? `Your payment of ${formatPHP(payment.amount_centavos)} (Receipt #${payment.receipt_reference}) has been verified. Official municipal receipt is now available.`
            : `Your payment reference ${payment.receipt_reference} was marked as ${input.status}. Notes: ${input.notes || 'Please consult the Municipal Treasury'}.`,
        type: input.status === 'Paid' ? 'success' : 'danger',
        link_url: `/payments/${id}`,
      });

      return updated;
    });

    verifyTx();
    return this.getById(id);
  }
}

