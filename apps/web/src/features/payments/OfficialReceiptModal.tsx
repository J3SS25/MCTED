import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Printer, ShieldCheck } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';

interface OfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

export function OfficialReceiptModal({ isOpen, onClose, payment }: OfficialReceiptModalProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Municipal Receipt" maxWidth="lg">
      <div className="space-y-6 printable-receipt">
        {/* Civic Header */}
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Republic of the Philippines &bull; Province of Batanes
          </p>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            MUNICIPALITY OF BASCO
          </h2>
          <p className="text-xs text-civic-forest dark:text-civic-light font-semibold">
            Municipal Community Tool and Equipment Bank (MCTEB)
          </p>
          <p className="text-xs font-mono text-slate-500 mt-2">
            OFFICIAL RECEIPT REF: <strong className="text-slate-800 dark:text-slate-200">{payment.receipt_reference}</strong>
          </p>
        </div>

        {/* Transaction Details Table */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div>
              <p className="text-slate-500">Payer Name:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{payment.payer_name}</p>
              <p className="text-slate-500 mt-1">Barangay:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{payment.payer_barangay}</p>
            </div>
            <div>
              <p className="text-slate-500">Payment Date:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(payment.created_at)}</p>
              <p className="text-slate-500 mt-1">Payment Method:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{payment.payment_method}</p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>Item / Description</span>
              <span>Amount</span>
            </div>
            <div className="p-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {payment.tool_name || 'Municipal Equipment Service Fee'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Tool Bank Municipal Ordinance &bull; Basco, Batanes
                </p>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {formatPHP(payment.amount_centavos)}
              </p>
            </div>
          </div>

          {/* Verification stamp */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Municipal Treasury Verified
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  Verified by: {payment.verifier_name || 'Treasury Staff'}
                </p>
              </div>
            </div>
            <Badge status={payment.status} />
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

