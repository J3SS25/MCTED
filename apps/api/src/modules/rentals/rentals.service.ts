import { RentalsRepository, type RentalWithDetails } from './rentals.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { ReservationsRepository } from '../reservations/reservations.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';
import type { CheckoutRentalInput, ReturnRentalInput, RentalStatus } from '@mcteb/shared';
import db from '../../db/client.js';

export class RentalsService {
  static getById(id: string): RentalWithDetails {
    const rental = RentalsRepository.findById(id);
    if (!rental) {
      throw AppError.notFound('Rental record not found');
    }
    return rental;
  }

  static getBorrowerRentals(userId: string): RentalWithDetails[] {
    return RentalsRepository.findByUserId(userId);
  }

  static getAllRentals(status?: RentalStatus): RentalWithDetails[] {
    return RentalsRepository.findAll(status);
  }

  static checkout(input: CheckoutRentalInput, staff: { id: string; name: string }): RentalWithDetails {
    const tool = ToolsRepository.findById(input.tool_id);
    if (!tool) {
      throw AppError.notFound('Tool not found');
    }

    if (tool.available_quantity < input.quantity) {
      throw AppError.conflict(
        `Insufficient stock for checkout. Available: ${tool.available_quantity}, requested: ${input.quantity}`,
      );
    }

    // Atomic Checkout Transaction
    const checkoutTx = db.transaction(() => {
      // 1. Create rental record
      const rental = RentalsRepository.createCheckout(input, staff.id);

      // 2. Adjust available tool stock
      ToolsRepository.adjustAvailableQuantity(input.tool_id, -input.quantity);

      // 3. If tied to a reservation, update reservation status to Completed
      if (input.reservation_id) {
        ReservationsRepository.updateStatus(input.reservation_id, 'Completed');
      }

      // 4. Record audit log
      AuditService.record({
        actor_id: staff.id,
        actor_name: staff.name,
        action: 'RENTAL_CHECKOUT',
        target_type: 'rental',
        target_id: rental.id,
        details: `Released ${input.quantity} unit(s) of "${tool.name}" to borrower (User ID: ${input.user_id}). Initial condition: ${input.initial_condition}`,
      });

      // 5. Notify borrower
      NotificationsService.create({
        user_id: input.user_id,
        title: 'Tool Handover Complete',
        message: `You have successfully received "${tool.name}". Return due date: ${input.due_date}. Please keep the tool in good condition.`,
        type: 'success',
        link_url: `/rentals/${rental.id}`,
      });

      return rental;
    });

    const res = checkoutTx();
    return this.getById(res.id);
  }

  static processReturn(id: string, input: ReturnRentalInput, staff: { id: string; name: string }): RentalWithDetails {
    const existing = this.getById(id);
    if (existing.status !== 'Borrowed') {
      throw AppError.badRequest(`Cannot process return for rental with status "${existing.status}"`);
    }

    // Atomic Return Transaction
    const returnTx = db.transaction(() => {
      // 1. Process return inspection
      const updated = RentalsRepository.processReturn(id, input, staff.id);
      if (!updated) {
        throw AppError.internal('Failed to update rental return state');
      }

      // 2. Return tool quantity to inventory
      ToolsRepository.adjustAvailableQuantity(existing.tool_id, existing.quantity);

      // 3. Update tool condition status if damaged or needs repair
      if (input.returned_condition === 'Needs Repair' || input.returned_condition === 'Under Maintenance') {
        ToolsRepository.update(existing.tool_id, {
          condition_status: input.returned_condition,
          availability_status: 'Maintenance',
        });
      }

      // 4. Audit Log
      const penaltyTotal = (input.overdue_penalty_centavos + input.damage_penalty_centavos) / 100;
      AuditService.record({
        actor_id: staff.id,
        actor_name: staff.name,
        action: 'RENTAL_RETURNED',
        target_type: 'rental',
        target_id: id,
        details: `Inspected return of "${existing.tool_name}". Condition: ${input.returned_condition}. Penalties: ₱${penaltyTotal.toFixed(2)}`,
      });

      // 5. Notify Borrower
      NotificationsService.create({
        user_id: existing.user_id,
        title: 'Tool Returned & Inspected',
        message: `Your return of "${existing.tool_name}" has been accepted. Inspection condition: ${input.returned_condition}. Thank you for using the municipal tool bank!`,
        type: 'info',
        link_url: `/rentals/${id}`,
      });

      return updated;
    });

    returnTx();
    return this.getById(id);
  }
}

