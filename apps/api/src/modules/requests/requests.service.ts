import { RequestsRepository, type BorrowRequestRecord } from './requests.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';

export class RequestsService {
  static getById(id: string): BorrowRequestRecord {
    const request = RequestsRepository.findById(id);
    if (!request) {
      throw AppError.notFound('Borrow request not found');
    }
    return request;
  }

  static getRequests(userId: string, isStaffOrAdmin: boolean): BorrowRequestRecord[] {
    return RequestsRepository.findForUser(userId, isStaffOrAdmin);
  }

  static createRequest(borrowerId: string, borrowerName: string, data: {
    item_id: string;
    start_date: string;
    end_date: string;
    request_message?: string;
  }): BorrowRequestRecord {
    const tool = ToolsRepository.findById(data.item_id);
    if (!tool) {
      throw AppError.notFound('Tool or equipment not found');
    }

    // 1. Rule: Prevent borrowing own items
    if (tool.user_id && tool.user_id === borrowerId) {
      throw AppError.badRequest('You cannot borrow your own tool or equipment');
    }

    // 2. Rule: Check start and end date validity
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      throw AppError.badRequest('End date must be on or after start date');
    }

    // 3. Rule: Prevent overlapping bookings/requests for active dates
    const hasConflict = RequestsRepository.hasOverlappingBooking(
      data.item_id,
      data.start_date,
      data.end_date,
    );
    if (hasConflict) {
      throw AppError.conflict('This equipment is already booked or requested for the selected dates');
    }

    const lenderId = tool.user_id || borrowerId; // If community owned without specific lender, system lender

    const record = RequestsRepository.create({
      item_id: data.item_id,
      borrower_id: borrowerId,
      lender_id: lenderId,
      start_date: data.start_date,
      end_date: data.end_date,
      request_message: data.request_message,
    });

    AuditService.record({
      actor_id: borrowerId,
      actor_name: borrowerName,
      action: 'BORROW_REQUEST_CREATED',
      target_type: 'borrow_request',
      target_id: record.id,
      details: `Submitted borrow request for "${tool.name}" from ${data.start_date} to ${data.end_date}`,
    });

    // Notify lender if distinct
    if (tool.user_id && tool.user_id !== borrowerId) {
      NotificationsService.create({
        user_id: tool.user_id,
        title: 'New Borrow Request Received',
        message: `${borrowerName} requested to borrow your ${tool.name} from ${data.start_date} to ${data.end_date}.`,
        type: 'info',
        link_url: `/requests/${record.id}`,
      });
    }

    return record;
  }

  static updateStatus(
    id: string,
    status: 'approved' | 'rejected' | 'returned' | 'cancelled',
    actor: { id: string; role: string; name: string },
  ): BorrowRequestRecord {
    const request = this.getById(id);

    const isLender = request.lender_id === actor.id;
    const isBorrower = request.borrower_id === actor.id;
    const isStaffOrAdmin = ['Administrator', 'Admin', 'Municipal Staff', 'Staff'].includes(actor.role);

    // Permission check
    if (status === 'cancelled' && !isBorrower && !isStaffOrAdmin) {
      throw AppError.forbidden('Only the borrower or staff can cancel this request');
    }

    if ((status === 'approved' || status === 'rejected') && !isLender && !isStaffOrAdmin) {
      throw AppError.forbidden('Only the item lender or staff/admin can approve or reject this request');
    }

    const updated = RequestsRepository.updateStatus(id, status);
    if (!updated) {
      throw AppError.notFound('Borrow request not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: `BORROW_REQUEST_${status.toUpperCase()}`,
      target_type: 'borrow_request',
      target_id: id,
      details: `Borrow request status updated to "${status}"`,
    });

    NotificationsService.create({
      user_id: request.borrower_id,
      title: `Borrow Request ${status.toUpperCase()}`,
      message: `Your request for equipment has been updated to "${status}".`,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'info',
      link_url: `/requests/${id}`,
    });

    return updated;
  }
}

