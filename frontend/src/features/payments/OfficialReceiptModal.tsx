import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Printer, Download, ShieldCheck, Calendar, FileText, User } from 'lucide-react';
import { formatPHP } from '@mcteb/shared';
import {
  downloadReceiptPdf,
  normalizeReceiptData,
  type PaymentReceiptSource,
} from '../../lib/pdf-receipt';

interface OfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentReceiptSource;
}

export function OfficialReceiptModal({ isOpen, onClose, payment }: OfficialReceiptModalProps) {
  if (!payment) return null;

  const receipt = normalizeReceiptData(payment);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadReceiptPdf(payment);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Municipal Transaction Receipt"
      maxWidth="2xl"
    >
      <div className="space-y-5 printable-receipt">
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
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
            <span>
              RECEIPT REF:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {receipt.receiptReference}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              TRANSACTION ID:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {receipt.transactionId}
              </strong>
            </span>
          </div>
        </div>

        {/* Borrower & Transaction Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Borrower / User Information
            </p>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {receipt.borrowerName}
            </p>
            <p className="text-slate-600 dark:text-slate-300">Email: {receipt.borrowerEmail}</p>
            <p className="text-slate-600 dark:text-slate-300">Contact: {receipt.borrowerPhone}</p>
            <p className="text-slate-600 dark:text-slate-300">
              Location: Brgy. {receipt.borrowerBarangay}, {receipt.borrowerProvince}
            </p>
            <p className="text-slate-600 dark:text-slate-300">Age: {receipt.borrowerAge}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Transaction & Schedule
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Date & Time:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {receipt.dateTimeFormatted}
              </strong>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Payment Method:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {receipt.paymentMethod}
              </strong>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Borrowing Duration:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {receipt.durationDays} day(s)
              </strong>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Return Schedule:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {receipt.returnScheduleLabel}
              </strong>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">Status:</span>
              <Badge status={receipt.transactionStatus} />
            </div>
          </div>
        </div>

        {/* Itemized Requested Tools Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-300 grid grid-cols-12 gap-2">
            <span className="col-span-5">Tool / Equipment</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Rate / Day</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {receipt.items.map((item, idx) => (
              <div
                key={`${item.tool_id || item.tool_name}-${idx}`}
                className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.tool_name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {item.category || 'Equipment'}
                    {item.deposit_fee_centavos > 0 &&
                      ` • Deposit: ${formatPHP(item.deposit_fee_centavos)}`}
                  </p>
                </div>
                <span className="col-span-2 text-center font-semibold">{item.quantity}</span>
                <span className="col-span-2 text-right text-slate-600 dark:text-slate-300">
                  {formatPHP(item.unit_cost_centavos)}
                </span>
                <span className="col-span-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {formatPHP(item.subtotal_centavos)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px]">
              Total Transaction Amount
            </span>
            <span className="font-bold text-base text-civic-forest dark:text-civic-light">
              {formatPHP(receipt.totalAmountCentavos)}
            </span>
          </div>
        </div>

        {/* Remarks / Notes */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Remarks / Notes
          </p>
          <p className="text-slate-700 dark:text-slate-300">{receipt.remarks}</p>
        </div>

        {/* Verification Stamp */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200">
                MCTEB Official Transaction Record
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                Processed / Verified by: {receipt.verifierName}
              </p>
            </div>
          </div>
          <Badge status={receipt.transactionStatus} />
        </div>

        {/* Modal Controls (hidden when printing) */}
        <div className="no-print flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
