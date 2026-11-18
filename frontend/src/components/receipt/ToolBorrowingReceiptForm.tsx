import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Printer,
  Download,
  RotateCcw,
  FilePlus2,
  Eye,
  PencilLine,
  ImagePlus,
  ImageOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  createBlankBorrowingReceipt,
  createDefaultBorrowingReceipt,
  downloadBorrowingReceiptPdf,
  RECEIPT_WARNING_TEXT,
  type BorrowingReceiptData,
  type BorrowingReceiptStatusFlags,
  type ReceiptConditionOption,
} from '../../lib/borrowing-receipt';

interface ToolBorrowingReceiptFormProps {
  initialSource?: Record<string, unknown> | null;
  onClose?: () => void;
}

const CONDITION_OPTIONS: Array<Exclude<ReceiptConditionOption, ''>> = ['Good', 'Fair', 'Damaged'];

const STATUS_OPTIONS: Array<{ key: keyof BorrowingReceiptStatusFlags; label: string }> = [
  { key: 'Borrowed', label: 'Borrowed' },
  { key: 'Returned', label: 'Returned' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Damaged', label: 'Damaged' },
  { key: 'Lost', label: 'Lost' },
];

export function ToolBorrowingReceiptForm({
  initialSource = null,
  onClose,
}: ToolBorrowingReceiptFormProps) {
  const formId = useId();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<BorrowingReceiptData>(() =>
    createDefaultBorrowingReceipt(initialSource),
  );
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const prevSourceKeyRef = useRef<unknown>(
    initialSource ? (initialSource.id ?? initialSource) : null,
  );

  useEffect(() => {
    const nextKey = initialSource ? (initialSource.id ?? initialSource) : null;
    if (prevSourceKeyRef.current !== nextKey) {
      prevSourceKeyRef.current = nextKey;
      setFormData(createDefaultBorrowingReceipt(initialSource));
    }
  }, [initialSource]);

  const updateField = <K extends keyof BorrowingReceiptData>(
    key: K,
    value: BorrowingReceiptData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCondition = (
    field: 'conditionBefore' | 'conditionUponReturn',
    option: Exclude<ReceiptConditionOption, ''>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === option ? '' : option,
    }));
  };

  const toggleStatus = (key: keyof BorrowingReceiptStatusFlags) => {
    setFormData((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [key]: !prev.status[key],
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({
          ...prev,
          showLogo: true,
          orgLogoUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearBlank = () => {
    setFormData(createBlankBorrowingReceipt());
  };

  const handleRestorePrefilled = () => {
    setFormData(createDefaultBorrowingReceipt(initialSource));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadBorrowingReceiptPdf(formData);
  };

  const inputBaseClass = isPrintPreview
    ? 'w-full bg-transparent border-b border-slate-400 px-1 py-0.5 text-xs text-slate-900 focus:outline-none pointer-events-none'
    : 'w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/20 rounded px-2 py-1 text-xs text-slate-900 transition-colors focus:outline-none';

  const renderPrintableField = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    options?: { type?: 'text' | 'date' | 'number'; placeholder?: string; min?: string },
  ) => {
    const inputType = options?.type ?? 'text';
    const isDate = inputType === 'date';

    return (
      <div className="space-y-0.5">
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-wide text-slate-600"
        >
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          min={options?.min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isPrintPreview ? '' : options?.placeholder}
          readOnly={isPrintPreview}
          className={`${inputBaseClass} ${
            isDate || isPrintPreview ? 'print:hidden' : 'print:border-0 print:border-b print:border-slate-500 print:rounded-none print:bg-transparent print:px-0 print:py-0.5'
          } ${isPrintPreview && isDate ? 'hidden' : ''}`}
        />
        {(isDate || isPrintPreview) && (
          <div
            aria-hidden="true"
            className={`${
              isPrintPreview ? 'block' : 'hidden print:block'
            } min-h-[22px] border-b border-slate-500 px-0.5 py-0.5 text-xs text-slate-900`}
          >
            {value || '\u00A0'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Digital Action Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={isPrintPreview ? 'outline' : 'primary'}
            onClick={() => setIsPrintPreview(false)}
            className="gap-1.5"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Digital Edit Mode
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isPrintPreview ? 'primary' : 'outline'}
            onClick={() => setIsPrintPreview(true)}
            className="gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            A4 Print Preview
          </Button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            aria-label="Upload organization logo"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => logoInputRef.current?.click()}
            className="gap-1.5"
            title="Upload custom organization logo"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Logo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => updateField('showLogo', !formData.showLogo)}
            className="gap-1.5"
            title={formData.showLogo ? 'Hide optional logo' : 'Show optional logo'}
          >
            <ImageOff className="h-3.5 w-3.5" />
            {formData.showLogo ? 'Hide Logo' : 'Show Logo'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClearBlank}
            className="gap-1.5"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            Blank Form
          </Button>
          {initialSource && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRestorePrefilled}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Data
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleDownloadPdf}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF Soft Copy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4 Hard Copy
          </Button>
          {onClose && (
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Printable A4 Sheet */}
      <article
        aria-label="Tool Borrowing Receipt Form"
        className="a4-receipt-sheet w-full max-w-[210mm] mx-auto bg-white text-slate-900 border border-slate-300 shadow-md rounded-lg p-5 sm:p-7 print:p-0 print:border-0 print:shadow-none print:rounded-none space-y-3.5 text-xs"
      >
        {/* Document Header + Section 1: Organization/School/Company Information */}
        <header className="border-b-2 border-slate-900 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {formData.showLogo && formData.orgLogoUrl && (
                <div className="w-14 h-14 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                  <img
                    src={formData.orgLogoUrl}
                    alt="Organization Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900">
                  1. Organization / School / Company Information
                </p>
                <div>
                  <label htmlFor={`${formId}-org-name`} className="sr-only">
                    Name of Organization
                  </label>
                  <input
                    id={`${formId}-org-name`}
                    type="text"
                    value={formData.orgName}
                    onChange={(e) => updateField('orgName', e.target.value)}
                    placeholder="Name of Organization / School / Company"
                    readOnly={isPrintPreview}
                    className={`w-full font-bold text-sm text-slate-900 bg-transparent ${
                      isPrintPreview
                        ? 'border-0 px-0 py-0'
                        : 'border border-dashed border-slate-300 hover:border-slate-400 focus:border-emerald-700 rounded px-1.5 py-0.5 focus:outline-none print:border-0 print:px-0'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor={`${formId}-org-address`}
                      className="block text-[9px] font-semibold uppercase text-slate-500"
                    >
                      Address
                    </label>
                    <input
                      id={`${formId}-org-address`}
                      type="text"
                      value={formData.orgAddress}
                      onChange={(e) => updateField('orgAddress', e.target.value)}
                      placeholder="Organization Address"
                      readOnly={isPrintPreview}
                      className={inputBaseClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${formId}-org-contact`}
                      className="block text-[9px] font-semibold uppercase text-slate-500"
                    >
                      Contact Information
                    </label>
                    <input
                      id={`${formId}-org-contact`}
                      type="text"
                      value={formData.orgContact}
                      onChange={(e) => updateField('orgContact', e.target.value)}
                      placeholder="Phone / Email / Website"
                      readOnly={isPrintPreview}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Title & Receipt Reference Box */}
            <div className="sm:w-52 flex-shrink-0 border border-slate-800 rounded-md overflow-hidden">
              <div className="bg-slate-900 text-white px-3 py-1.5 text-center">
                <h1 className="text-xs font-extrabold uppercase tracking-wider">
                  Tool Borrowing Receipt
                </h1>
              </div>
              <div className="p-2 bg-slate-50 space-y-1">
                <label
                  htmlFor={`${formId}-receipt-no`}
                  className="block text-[9px] font-bold uppercase text-slate-500"
                >
                  Receipt / Control No.
                </label>
                <input
                  id={`${formId}-receipt-no`}
                  type="text"
                  value={formData.receiptNo}
                  onChange={(e) => updateField('receiptNo', e.target.value)}
                  placeholder="e.g. TBR-2026-001"
                  readOnly={isPrintPreview}
                  className="w-full font-mono text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-700 print:border-0 print:border-b print:border-slate-500 print:rounded-none print:bg-transparent"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Section 2: Borrower Information */}
        <section className="border border-slate-300 rounded-md overflow-hidden">
          <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
            2. Borrower Information
          </h2>
          <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {renderPrintableField(
              `${formId}-borrower-name`,
              'Full Name',
              formData.borrowerFullName,
              (v) => updateField('borrowerFullName', v),
              { placeholder: 'Last Name, First Name, Middle Initial' },
            )}
            {renderPrintableField(
              `${formId}-borrower-id`,
              'Student / Employee ID',
              formData.borrowerId,
              (v) => updateField('borrowerId', v),
              { placeholder: 'ID Number' },
            )}
            {renderPrintableField(
              `${formId}-borrower-dept`,
              'Department / Course',
              formData.borrowerDepartment,
              (v) => updateField('borrowerDepartment', v),
              { placeholder: 'Department, Course, Office, or Barangay' },
            )}
            {renderPrintableField(
              `${formId}-borrower-contact`,
              'Contact Number',
              formData.borrowerContact,
              (v) => updateField('borrowerContact', v),
              { placeholder: 'Mobile / Telephone Number' },
            )}
            <div className="sm:col-span-2">
              {renderPrintableField(
                `${formId}-borrower-sig`,
                'Signature',
                formData.borrowerSignature,
                (v) => updateField('borrowerSignature', v),
                { placeholder: 'Type full name for digital signature or leave blank to sign on hard copy' },
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Tool/Equipment Information */}
        <section className="border border-slate-300 rounded-md overflow-hidden">
          <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
            3. Tool / Equipment Information
          </h2>
          <div className="p-2.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2">
              <div className="sm:col-span-6">
                {renderPrintableField(
                  `${formId}-tool-name`,
                  'Tool / Equipment Name',
                  formData.toolName,
                  (v) => updateField('toolName', v),
                  { placeholder: 'e.g. Makita Cordless Drill' },
                )}
              </div>
              <div className="sm:col-span-4">
                {renderPrintableField(
                  `${formId}-tool-serial`,
                  'Serial Number (if applicable)',
                  formData.serialNumber,
                  (v) => updateField('serialNumber', v),
                  { placeholder: 'S/N or N/A' },
                )}
              </div>
              <div className="sm:col-span-2">
                {renderPrintableField(
                  `${formId}-tool-qty`,
                  'Quantity',
                  formData.quantity,
                  (v) => updateField('quantity', v),
                  { type: 'number', min: '1', placeholder: '1' },
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2 items-start">
              <div className="sm:col-span-5 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Condition Before Borrowing
                </span>
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  {CONDITION_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.conditionBefore === option}
                        onChange={() => toggleCondition('conditionBefore', option)}
                        className="h-3.5 w-3.5 rounded border-slate-400 accent-emerald-800"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-7">
                {renderPrintableField(
                  `${formId}-tool-remarks`,
                  'Remarks',
                  formData.toolRemarks,
                  (v) => updateField('toolRemarks', v),
                  { placeholder: 'Accessories included, pre-existing scratches, or purpose notes' },
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 & Section 5 side by side on A4 to stay compact on 1 page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Section 4: Borrowing Schedule */}
          <section className="border border-slate-300 rounded-md overflow-hidden">
            <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              4. Borrowing Schedule
            </h2>
            <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
              {renderPrintableField(
                `${formId}-date-borrowed`,
                'Date Borrowed',
                formData.dateBorrowed,
                (v) => updateField('dateBorrowed', v),
                { type: 'date' },
              )}
              {renderPrintableField(
                `${formId}-expected-return-date`,
                'Expected Return Date',
                formData.expectedReturnDate,
                (v) => updateField('expectedReturnDate', v),
                { type: 'date' },
              )}
            </div>
          </section>

          {/* Section 5: Return Details */}
          <section className="border border-slate-300 rounded-md overflow-hidden">
            <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              5. Return Details
            </h2>
            <div className="p-2.5 space-y-2">
              {renderPrintableField(
                `${formId}-actual-return-date`,
                'Actual Return Date',
                formData.actualReturnDate,
                (v) => updateField('actualReturnDate', v),
                { type: 'date' },
              )}

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Condition Upon Return
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {CONDITION_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.conditionUponReturn === option}
                        onChange={() => toggleCondition('conditionUponReturn', option)}
                        className="h-3.5 w-3.5 rounded border-slate-400 accent-emerald-800"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                {renderPrintableField(
                  `${formId}-received-by`,
                  'Received By',
                  formData.receivedBy,
                  (v) => updateField('receivedBy', v),
                  { placeholder: 'Receiving staff name' },
                )}
                {renderPrintableField(
                  `${formId}-return-remarks`,
                  'Remarks',
                  formData.returnRemarks,
                  (v) => updateField('returnRemarks', v),
                  { placeholder: 'Inspection notes upon return' },
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Section 6: Status Section */}
        <section className="border border-slate-300 rounded-md overflow-hidden">
          <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
            6. Status Section
          </h2>
          <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-3">
            {STATUS_OPTIONS.map((item) => (
              <label
                key={item.key}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.status[item.key]}
                  onChange={() => toggleStatus(item.key)}
                  className="h-4 w-4 rounded border-slate-500 accent-emerald-800"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Section 7: Terms, Warnings, and Penalties */}
        <section className="border-2 border-amber-600/80 bg-amber-50/70 rounded-md overflow-hidden">
          <h2 className="bg-amber-100 border-b border-amber-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-700 flex-shrink-0" />
            <span>7. Terms, Warnings, and Penalties</span>
          </h2>
          <div className="p-2.5 space-y-1.5 text-[11px] leading-snug text-slate-800">
            <p className="font-extrabold text-red-800 tracking-wide">
              {RECEIPT_WARNING_TEXT.heading}
            </p>
            {RECEIPT_WARNING_TEXT.paragraphs.map((paragraph, index) => (
              <p key={index} className={index === 3 ? 'font-semibold text-slate-900 pt-0.5' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* Section 8: Approval Section */}
        <section className="border border-slate-300 rounded-md overflow-hidden">
          <h2 className="bg-slate-100 border-b border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800">
            8. Approval Section
          </h2>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <div className="pt-3">
                <label htmlFor={`${formId}-approval-borrower-sig`} className="sr-only">
                  Borrower&apos;s Signature
                </label>
                <input
                  id={`${formId}-approval-borrower-sig`}
                  type="text"
                  value={formData.approvalBorrowerSignature}
                  onChange={(e) => updateField('approvalBorrowerSignature', e.target.value)}
                  placeholder={isPrintPreview ? '' : 'Digital signature / name'}
                  readOnly={isPrintPreview}
                  className="w-full text-center text-xs font-medium text-slate-900 bg-transparent border-0 border-b border-slate-700 pb-0.5 focus:outline-none focus:border-emerald-700"
                />
              </div>
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Borrower&apos;s Signature
              </p>
            </div>

            <div className="space-y-1">
              <div className="pt-3">
                <label htmlFor={`${formId}-approval-auth-sig`} className="sr-only">
                  Authorized Personnel Signature
                </label>
                <input
                  id={`${formId}-approval-auth-sig`}
                  type="text"
                  value={formData.authorizedPersonnelSignature}
                  onChange={(e) => updateField('authorizedPersonnelSignature', e.target.value)}
                  placeholder={isPrintPreview ? '' : 'Staff / Custodian name'}
                  readOnly={isPrintPreview}
                  className="w-full text-center text-xs font-medium text-slate-900 bg-transparent border-0 border-b border-slate-700 pb-0.5 focus:outline-none focus:border-emerald-700"
                />
              </div>
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Authorized Personnel Signature
              </p>
            </div>

            <div className="space-y-1">
              <div className="pt-3">
                <label htmlFor={`${formId}-approval-date`} className="sr-only">
                  Date Signed
                </label>
                <input
                  id={`${formId}-approval-date`}
                  type="date"
                  value={formData.dateSigned}
                  onChange={(e) => updateField('dateSigned', e.target.value)}
                  readOnly={isPrintPreview}
                  className={`w-full text-center text-xs font-medium text-slate-900 bg-transparent border-0 border-b border-slate-700 pb-0.5 focus:outline-none focus:border-emerald-700 ${
                    isPrintPreview ? 'hidden' : 'print:hidden'
                  }`}
                />
                <div
                  aria-hidden="true"
                  className={`${
                    isPrintPreview ? 'block' : 'hidden print:block'
                  } min-h-[20px] text-center text-xs font-medium text-slate-900 border-b border-slate-700 pb-0.5`}
                >
                  {formData.dateSigned || '\u00A0'}
                </div>
              </div>
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Date Signed
              </p>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
