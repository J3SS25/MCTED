import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { ToolBorrowingReceiptForm } from './ToolBorrowingReceiptForm';

interface ToolBorrowingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: Record<string, unknown> | null;
  title?: string;
}

export function ToolBorrowingReceiptModal({
  isOpen,
  onClose,
  source = null,
  title = 'Tool Borrowing Receipt Form',
}: ToolBorrowingReceiptModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="4xl" printable>
      <ToolBorrowingReceiptForm initialSource={source} onClose={onClose} />
    </Modal>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export function useReservationApprovalReceipt(options: {
  reviewerName?: string | null;
  onApproved?: (updated: Record<string, unknown>) => void | Promise<void>;
}) {
  const [approvingRes, setApprovingRes] = useState<Record<string, unknown> | null>(null);
  const [approvalTimestamp, setApprovalTimestamp] = useState<string>('');

  const openApproval = async (reservation: Record<string, unknown>) => {
    setApprovingRes(reservation);
    setApprovalTimestamp(new Date().toISOString());
    if (typeof reservation.id !== 'string') return;
    try {
      const updated = await apiRequest<Record<string, unknown>>(
        `/reservations/${reservation.id}/review`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            decision: 'Approved',
          }),
        },
      );
      setApprovingRes((prev) => (prev && prev.id === reservation.id ? updated : prev));
      await options.onApproved?.(updated);
    } catch (err: unknown) {
      setApprovingRes((prev) => (prev && prev.id === reservation.id ? null : prev));
      alert(err instanceof Error ? err.message : 'Approval action failed');
    }
  };

  const closeApproval = () => {
    setApprovingRes(null);
  };

  const source = useMemo<Record<string, unknown> | null>(() => {
    if (!approvingRes) return null;
    return {
      ...approvingRes,
      status: 'Approved',
      reviewed_by_name: approvingRes.reviewed_by_name || options.reviewerName || '',
      reviewed_at: approvingRes.reviewed_at || approvalTimestamp,
    };
  }, [approvingRes, options.reviewerName, approvalTimestamp]);

  return {
    isApproving: !!approvingRes,
    source,
    openApproval,
    closeApproval,
  };
}
