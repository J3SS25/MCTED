import { ReservationsRepository, type ReservationWithDetails } from './reservations.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';
import type { CreateReservationInput, ReviewReservationInput, ReservationStatus } from '@mcteb/shared';
import db from '../../db/client.js';

export class ReservationsService {
  static getById(id: string): ReservationWithDetails {
    const reservation = ReservationsRepository.findById(id);
    if (!reservation) {
      throw AppError.notFound('Reservation request not found');
    }
    return reservation;
  }

  static getBorrowerReservations(userId: string): ReservationWithDetails[] {
    return ReservationsRepository.findByUserId(userId);
  }

  static getAllReservations(status?: ReservationStatus): ReservationWithDetails[] {
    return ReservationsRepository.findAll(status);
  }

  static createReservation(
    userId: string,
    borrowerName: string,
    input: CreateReservationInput,
  ): ReservationWithDetails {
    const tool = ToolsRepository.findById(input.tool_id);
    if (!tool) {
      throw AppError.notFound('Requested tool not found in catalog');
    }

    if (tool.availability_status === 'Archived' || tool.availability_status === 'Damaged') {
      throw AppError.badRequest(`This tool is currently ${tool.availability_status.toLowerCase()} and cannot be reserved`);
    }

    // Check date conflict & active stock limits
    const currentlyReserved = ReservationsRepository.getActiveReservedQuantityForDates(
      input.tool_id,
      input.pickup_date,
      input.return_date,
    );

    if (currentlyReserved + input.quantity > tool.total_quantity) {
      throw AppError.conflict(
        `Insufficient tool inventory for selected dates. Total stock: ${tool.total_quantity}, already booked: ${currentlyReserved}`,
      );
    }

    // Create reservation inside a transaction
    const createTx = db.transaction(() => {
      const created = ReservationsRepository.create(userId, input);

      AuditService.record({
        actor_id: userId,
        actor_name: borrowerName,
        action: 'RESERVATION_CREATED',
        target_type: 'reservation',
        target_id: created.id,
        details: `Requested ${input.quantity} unit(s) of "${tool.name}" from ${input.pickup_date} to ${input.return_date}`,
      });

      NotificationsService.create({
        user_id: userId,
        title: 'Reservation Submitted',
        message: `Your reservation request for "${tool.name}" (${input.pickup_date} to ${input.return_date}) has been received and is pending staff review.`,
        type: 'info',
        link_url: `/reservations/${created.id}`,
      });

      return created;
    });

    const res = createTx();
    return this.getById(res.id);
  }

  static reviewReservation(
    id: string,
    input: ReviewReservationInput,
    reviewer: { id: string; name: string },
  ): ReservationWithDetails {
    const existing = this.getById(id);
    if (existing.status !== 'Pending') {
      throw AppError.badRequest(`Cannot review reservation with status "${existing.status}"`);
    }

    // Transaction for review
    const reviewTx = db.transaction(() => {
      const updated = ReservationsRepository.updateDecision(
        id,
        input.decision,
        reviewer.id,
        input.staff_notes,
      );

      if (!updated) {
        throw AppError.internal('Failed to update reservation decision');
      }

      AuditService.record({
        actor_id: reviewer.id,
        actor_name: reviewer.name,
        action: input.decision === 'Approved' ? 'RESERVATION_APPROVED' : 'RESERVATION_REJECTED',
        target_type: 'reservation',
        target_id: id,
        details: `${input.decision} reservation for "${existing.borrower_name}". Notes: ${input.staff_notes || 'None'}`,
      });

      NotificationsService.create({
        user_id: existing.user_id,
        title: `Reservation ${input.decision}`,
        message:
          input.decision === 'Approved'
            ? `Good news! Your reservation for "${existing.tool_name}" was approved by Municipal Staff. You may proceed to pickup on ${existing.pickup_date}.`
            : `Your reservation for "${existing.tool_name}" was rejected. Reason: ${input.staff_notes || 'Municipal policy / stock constraint'}.`,
        type: input.decision === 'Approved' ? 'success' : 'danger',
        link_url: `/reservations/${id}`,
      });

      return updated;
    });

    reviewTx();
    return this.getById(id);
  }

  static cancelReservation(id: string, user: { id: string; name: string; role: string }): ReservationWithDetails {
    const reservation = this.getById(id);

    // Borrower IDOR check
    if (user.role === 'Borrower' && reservation.user_id !== user.id) {
      throw AppError.forbidden('You can only cancel your own reservations');
    }

    if (reservation.status !== 'Pending' && reservation.status !== 'Approved') {
      throw AppError.badRequest(`Cannot cancel reservation with status "${reservation.status}"`);
    }

    const cancelTx = db.transaction(() => {
      const updated = ReservationsRepository.updateStatus(id, 'Cancelled');
      if (!updated) {
        throw AppError.internal('Failed to cancel reservation');
      }

      AuditService.record({
        actor_id: user.id,
        actor_name: user.name,
        action: 'RESERVATION_CANCELLED',
        target_type: 'reservation',
        target_id: id,
        details: `Cancelled reservation for "${reservation.tool_name}"`,
      });

      NotificationsService.create({
        user_id: reservation.user_id,
        title: 'Reservation Cancelled',
        message: `Reservation for "${reservation.tool_name}" has been marked as Cancelled.`,
        type: 'warning',
        link_url: `/reservations/${id}`,
      });

      return updated;
    });

    cancelTx();
    return this.getById(id);
  }
}

