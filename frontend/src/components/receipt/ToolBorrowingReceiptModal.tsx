import React from 'react';
import { createPortal } from 'react-dom';
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
