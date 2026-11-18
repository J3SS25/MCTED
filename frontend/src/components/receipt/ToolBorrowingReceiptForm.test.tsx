import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { ToolBorrowingReceiptForm } from './ToolBorrowingReceiptForm';
import {
  ToolBorrowingReceiptModal,
  useReservationApprovalReceipt,
} from './ToolBorrowingReceiptModal';
import { apiRequest } from '../../lib/api';
import {
  createDefaultBorrowingReceipt,
  generateBorrowingReceiptPdfBytes,
  RECEIPT_WARNING_TEXT,
} from '../../lib/borrowing-receipt';

vi.mock('../../lib/api', () => ({
  apiRequest: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

const SAMPLE_RENTAL_RECORD = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: 'a0000000-0000-4000-8000-000000000003',
  tool_id: '11111111-1111-4111-8111-111111111111',
  tool_name: 'Honda Gasoline Water Pump',
  tool_serial_number: 'HND-WP-4410',
  quantity: 2,
  status: 'Borrowed',
  initial_condition: 'Good',
  returned_condition: null,
  due_date: '2099-12-31',
  created_at: '2026-11-18T02:15:00.000Z',
  pickup_date: '2026-11-18',
  purpose: 'Community irrigation canal clearing',
  borrower_name: 'Juan Dela Cruz',
  borrower_phone: '09171234567',
  borrower_barangay: 'Kaychanarianan',
  released_by_name: 'Maria Santos',
  received_by_name: null,
  inspection_notes: null,
};

describe('ToolBorrowingReceiptForm', () => {
  it('renders all 8 required sections, fields, checkboxes, and exact warning terms', () => {
    render(<ToolBorrowingReceiptForm />);

    // 8 Section Headings
    expect(screen.getByText(/1\. Organization \/ School \/ Company Information/i)).toBeDefined();
    expect(screen.getByText(/2\. Borrower Information/i)).toBeDefined();
    expect(screen.getByText(/3\. Tool \/ Equipment Information/i)).toBeDefined();
    expect(screen.getByText(/4\. Borrowing Schedule/i)).toBeDefined();
    expect(screen.getByText(/5\. Return Details/i)).toBeDefined();
    expect(screen.getByText(/6\. Status Section/i)).toBeDefined();
    expect(screen.getByText(/7\. Terms, Warnings, and Penalties/i)).toBeDefined();
    expect(screen.getByText(/8\. Approval Section/i)).toBeDefined();

    // Key fields across Sections 1-5 & 8
    expect(screen.getByLabelText('Name of Organization')).toBeDefined();
    expect(screen.getByLabelText('Address')).toBeDefined();
    expect(screen.getByLabelText('Contact Information')).toBeDefined();
    expect(screen.getByLabelText('Full Name')).toBeDefined();
    expect(screen.getByLabelText('Student / Employee ID')).toBeDefined();
    expect(screen.getByLabelText('Department / Course')).toBeDefined();
    expect(screen.getByLabelText('Contact Number')).toBeDefined();
    expect(screen.getByLabelText('Signature')).toBeDefined();
    expect(screen.getByLabelText('Tool / Equipment Name')).toBeDefined();
    expect(screen.getByLabelText('Serial Number (if applicable)')).toBeDefined();
    expect(screen.getByLabelText('Quantity')).toBeDefined();
    expect(screen.getByLabelText('Date Borrowed')).toBeDefined();
    expect(screen.getByLabelText('Expected Return Date')).toBeDefined();
    expect(screen.getByLabelText('Actual Return Date')).toBeDefined();
    expect(screen.queryByLabelText('Time Borrowed')).toBeNull();
    expect(screen.queryByLabelText('Expected Return Time')).toBeNull();
    expect(screen.queryByLabelText('Actual Return Time')).toBeNull();
    expect(screen.getByLabelText('Received By')).toBeDefined();
    expect(screen.getByLabelText("Borrower's Signature")).toBeDefined();
    expect(screen.getByLabelText('Authorized Personnel Signature')).toBeDefined();
    expect(screen.getByLabelText('Date Signed')).toBeDefined();

    // Condition checkboxes (Good, Fair, Damaged) appear for both before borrowing & upon return
    expect(screen.getAllByRole('checkbox', { name: 'Good' })).toHaveLength(2);
    expect(screen.getAllByRole('checkbox', { name: 'Fair' })).toHaveLength(2);
    expect(screen.getAllByRole('checkbox', { name: 'Damaged' })).toHaveLength(3); // 2 conditions + 1 status

    // Status checkboxes
    expect(screen.getByRole('checkbox', { name: 'Borrowed' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Returned' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Overdue' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'Lost' })).toBeDefined();

    // Section 7 exact warning text
    expect(screen.getByText(RECEIPT_WARNING_TEXT.heading)).toBeDefined();
    for (const para of RECEIPT_WARNING_TEXT.paragraphs) {
      expect(screen.getByText(para)).toBeDefined();
    }
  });

  it('pre-populates from rental data and supports digital editing and blank form reset', () => {
    render(<ToolBorrowingReceiptForm initialSource={SAMPLE_RENTAL_RECORD} />);

    const borrowerInput = screen.getByLabelText<HTMLInputElement>('Full Name');
    const toolInput = screen.getByLabelText<HTMLInputElement>('Tool / Equipment Name');
    const serialInput = screen.getByLabelText<HTMLInputElement>('Serial Number (if applicable)');
    const borrowedStatusCheckbox = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Borrowed',
    });
    const overdueStatusCheckbox = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Overdue',
    });

    expect(borrowerInput.value).toBe('Juan Dela Cruz');
    expect(toolInput.value).toBe('Honda Gasoline Water Pump');
    expect(serialInput.value).toBe('HND-WP-4410');
    expect(borrowedStatusCheckbox.checked).toBe(true);
    expect(overdueStatusCheckbox.checked).toBe(false);

    // Edit digitally
    fireEvent.change(borrowerInput, { target: { value: 'Elena Mendoza' } });
    expect(borrowerInput.value).toBe('Elena Mendoza');

    // Toggle status checkbox
    fireEvent.click(overdueStatusCheckbox);
    expect(overdueStatusCheckbox.checked).toBe(true);

    // Clear to blank form
    fireEvent.click(screen.getByRole('button', { name: /Blank Form/i }));
    expect(borrowerInput.value).toBe('');
    expect(toolInput.value).toBe('');
    expect(borrowedStatusCheckbox.checked).toBe(false);

    // Restore pre-filled data
    fireEvent.click(screen.getByRole('button', { name: /Reset Data/i }));
    expect(borrowerInput.value).toBe('Juan Dela Cruz');
    expect(borrowedStatusCheckbox.checked).toBe(true);
  });

  it('generates a valid A4 PDF soft copy containing form details and warning text', () => {
    const receipt = createDefaultBorrowingReceipt(SAMPLE_RENTAL_RECORD);
    receipt.status.Returned = true;
    receipt.conditionUponReturn = 'Fair';
    receipt.receivedBy = 'Carlos Reyes';

    const bytes = generateBorrowingReceiptPdfBytes(receipt);
    const decoded = new TextDecoder().decode(bytes);

    expect(decoded.startsWith('%PDF-1.4')).toBe(true);
    expect(decoded.endsWith('%%EOF')).toBe(true);
    expect(decoded).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(decoded).toContain('TOOL BORROWING RECEIPT FORM');
    expect(decoded).toContain('Juan Dela Cruz');
    expect(decoded).toContain('Honda Gasoline Water Pump');
    expect(decoded).toContain('HND-WP-4410');
    expect(decoded).toContain('[X] Borrowed');
    expect(decoded).toContain('[X] Returned');
    expect(decoded).toContain('[X] Fair');
    expect(decoded).toContain('WARNING:');
    expect(decoded).toContain(
      'The borrower is fully responsible for the borrowed tool/equipment during the borrowing period.',
    );
    expect(decoded).toContain('Date Borrowed');
    expect(decoded).toContain('Expected Return Date');
    expect(decoded).toContain('Actual Return Date');
    expect(decoded).not.toContain('Time Borrowed');
    expect(decoded).not.toContain('Expected Return Time');
    expect(decoded).not.toContain('Actual Return Time');
  });

  it('pre-populates an Approved reservation receipt with Borrowed status, staff signer, and combined remarks', () => {
    const approvedReservation = {
      id: '33333333-3333-4333-8333-333333333333',
      user_id: 'a0000000-0000-4000-8000-000000000003',
      tool_id: '11111111-1111-4111-8111-111111111111',
      tool_name: 'Portable Generator 3500W',
      tool_serial_number: 'GEN-3500-09',
      tool_condition_status: 'Good',
      quantity: 1,
      status: 'Approved',
      pickup_date: '2026-11-20',
      return_date: '2099-12-31',
      created_at: '2026-11-18T01:00:00.000Z',
      reviewed_at: '2026-11-18T08:30:00.000Z',
      reviewed_by_name: 'Admin Elena',
      purpose: 'Barangay outage backup',
      staff_notes: 'Verified ID and fuel safety orientation',
      borrower_name: 'Juan Dela Cruz',
      borrower_phone: '09171234567',
      borrower_barangay: 'Kaychanarianan',
    };

    const receipt = createDefaultBorrowingReceipt(approvedReservation);

    expect(receipt.status.Borrowed).toBe(true);
    expect(receipt.status.Returned).toBe(false);
    expect(receipt.authorizedPersonnelSignature).toBe('Admin Elena');
    expect(receipt.toolRemarks).toBe(
      'Barangay outage backup (Staff Note: Verified ID and fuel safety orientation)',
    );
    expect(receipt.dateBorrowed).toBe('2026-11-20');
    expect(receipt.dateSigned).toBe('2026-11-18');
  });

  it('renders only the receipt modal without the review banner when approving a reservation', async () => {
    const onApprovedSpy = vi.fn();
    const pendingReservation = {
      id: '44444444-4444-4444-8444-444444444444',
      user_id: 'a0000000-0000-4000-8000-000000000003',
      tool_id: '11111111-1111-4111-8111-111111111111',
      tool_name: 'Backpack Sprayer 20L',
      tool_serial_number: 'BPS-20-09',
      tool_condition_status: 'Good',
      quantity: 1,
      status: 'Pending',
      pickup_date: '2026-11-20',
      return_date: '2099-12-31',
      created_at: '2026-11-18T01:00:00.000Z',
      purpose: 'Barangay agricultural spraying',
      borrower_name: 'Pedro Batanes',
      borrower_phone: '09171234567',
      borrower_barangay: 'Kaychanarianan',
    };

    const approvedResponse = {
      ...pendingReservation,
      status: 'Approved',
      reviewed_by_name: 'Admin Elena',
      reviewed_at: '2026-11-18T08:30:00.000Z',
    };

    vi.mocked(apiRequest).mockResolvedValueOnce(approvedResponse);

    function ApprovalModalHarness() {
      const approvalFlow = useReservationApprovalReceipt({
        reviewerName: 'Admin Elena',
        onApproved: onApprovedSpy,
      });

      return (
        <>
          <button type="button" onClick={() => approvalFlow.openApproval(pendingReservation)}>
            Approve
          </button>
          <ToolBorrowingReceiptModal
            isOpen={approvalFlow.isApproving}
            onClose={approvalFlow.closeApproval}
            source={approvalFlow.source}
          />
        </>
      );
    }

    render(<ApprovalModalHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(screen.getByText('Tool Borrowing Receipt Form')).toBeDefined();
    expect(screen.queryByText(/Reviewing request for/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Confirm & Approve Reservation/i })).toBeNull();

    const borrowerInput = screen.getByLabelText<HTMLInputElement>('Full Name');
    const toolInput = screen.getByLabelText<HTMLInputElement>('Tool / Equipment Name');
    expect(borrowerInput.value).toBe('Pedro Batanes');
    expect(toolInput.value).toBe('Backpack Sprayer 20L');

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/reservations/44444444-4444-4444-8444-444444444444/review',
        {
          method: 'PATCH',
          body: JSON.stringify({ decision: 'Approved' }),
        },
      );
      expect(onApprovedSpy).toHaveBeenCalledWith(approvedResponse);
    });
  });
});
