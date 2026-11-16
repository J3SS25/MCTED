import { formatDate, formatDateTime, type ReceiptItem } from '@mcteb/shared';

export interface PaymentReceiptSource {
  id: string;
  receipt_reference: string;
  amount_centavos: number;
  payment_method: string;
  status: string;
  created_at: string;
  verified_at?: string | null;
  verifier_name?: string | null;
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  payer_barangay?: string;
  payer_province?: string;
  payer_age?: number | null;
  payer_address?: string;
  tool_id?: string | null;
  tool_name?: string | null;
  tool_category?: string | null;
  tool_rental_fee_centavos?: number | null;
  tool_deposit_fee_centavos?: number | null;
  reservation_quantity?: number | null;
  reservation_pickup_date?: string | null;
  reservation_return_date?: string | null;
  reservation_purpose?: string | null;
  rental_quantity?: number | null;
  rental_due_date?: string | null;
  rental_notes?: string | null;
  items_json?: string | null;
  pickup_date?: string | null;
  return_date?: string | null;
  duration_days?: number | null;
  remarks?: string | null;
}

export interface NormalizedReceiptData {
  transactionId: string;
  receiptReference: string;
  dateTimeFormatted: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  borrowerBarangay: string;
  borrowerProvince: string;
  borrowerAge: string;
  items: ReceiptItem[];
  totalAmountCentavos: number;
  paymentMethod: string;
  transactionStatus: string;
  durationDays: number;
  pickupDate: string | null;
  returnDate: string | null;
  returnScheduleLabel: string;
  remarks: string;
  verifierName: string;
}

export function parseReceiptItems(payment: PaymentReceiptSource): ReceiptItem[] {
  if (payment.items_json) {
    try {
      const parsed = JSON.parse(payment.items_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          tool_id: item.tool_id ? String(item.tool_id) : undefined,
          tool_name: String(item.tool_name || 'Equipment Item'),
          category: item.category ? String(item.category) : undefined,
          quantity: Math.max(1, Number(item.quantity) || 1),
          unit_cost_centavos: Math.max(0, Number(item.unit_cost_centavos) || 0),
          deposit_fee_centavos: Math.max(0, Number(item.deposit_fee_centavos) || 0),
          duration_days: Math.max(1, Number(item.duration_days) || 1),
          subtotal_centavos: Math.max(0, Number(item.subtotal_centavos) || 0),
        }));
      }
    } catch {
      // Fallback to single item
    }
  }

  const quantity = payment.reservation_quantity || payment.rental_quantity || 1;
  const durationDays = computeDurationDays(
    payment.pickup_date || payment.reservation_pickup_date,
    payment.return_date || payment.reservation_return_date || payment.rental_due_date,
    payment.duration_days,
  );
  const unitCost =
    payment.tool_rental_fee_centavos ??
    Math.round(payment.amount_centavos / Math.max(1, quantity * durationDays));

  return [
    {
      tool_id: payment.tool_id || undefined,
      tool_name: payment.tool_name || 'Municipal Equipment Service Fee',
      category: payment.tool_category || 'Municipal Inventory',
      quantity,
      unit_cost_centavos: unitCost,
      deposit_fee_centavos: payment.tool_deposit_fee_centavos || 0,
      duration_days: durationDays,
      subtotal_centavos: payment.amount_centavos,
    },
  ];
}

function computeDurationDays(
  pickup?: string | null,
  returnDate?: string | null,
  explicitDuration?: number | null,
): number {
  if (explicitDuration && explicitDuration > 0) return explicitDuration;
  if (pickup && returnDate) {
    const start = new Date(pickup).getTime();
    const end = new Date(returnDate).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }
  }
  return 1;
}

export function normalizeReceiptData(payment: PaymentReceiptSource): NormalizedReceiptData {
  const pickupDate = payment.pickup_date || payment.reservation_pickup_date || null;
  const returnDate =
    payment.return_date || payment.reservation_return_date || payment.rental_due_date || null;
  const durationDays = computeDurationDays(pickupDate, returnDate, payment.duration_days);
  const items = parseReceiptItems(payment);

  const returnScheduleLabel =
    pickupDate && returnDate
      ? `${formatDate(pickupDate)} to ${formatDate(returnDate)}`
      : returnDate
        ? `Due on ${formatDate(returnDate)}`
        : 'Standard Counter Schedule (Upon Pickup)';

  return {
    transactionId: payment.id,
    receiptReference: payment.receipt_reference,
    dateTimeFormatted: formatDateTime(payment.created_at),
    borrowerName: payment.payer_name || 'Registered Borrower',
    borrowerEmail: payment.payer_email || '—',
    borrowerPhone: payment.payer_phone || '—',
    borrowerBarangay: payment.payer_barangay || 'Basco',
    borrowerProvince: payment.payer_province || 'Batanes',
    borrowerAge: payment.payer_age ? `${payment.payer_age} years old` : 'Verified Adult (18+)',
    items,
    totalAmountCentavos: payment.amount_centavos,
    paymentMethod: payment.payment_method,
    transactionStatus: payment.status,
    durationDays,
    pickupDate,
    returnDate,
    returnScheduleLabel,
    remarks:
      payment.remarks ||
      payment.reservation_purpose ||
      payment.rental_notes ||
      'No additional remarks.',
    verifierName: payment.verifier_name || (payment.status === 'Paid' ? 'Automated Demo Gateway' : 'Pending Treasury Review'),
  };
}

function formatPdfPHP(centavos: number): string {
  const pesos = (centavos / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `PHP ${pesos}`;
}

function sanitizePdfText(text: string): string {
  return text
    .replace(/₱/g, 'PHP ')
    .replace(/[•–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxChars = 76): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildReceiptLines(receipt: NormalizedReceiptData): Array<{ text: string; bold?: boolean }> {
  const lines: Array<{ text: string; bold?: boolean }> = [
    { text: 'REPUBLIC OF THE PHILIPPINES - PROVINCE OF BATANES', bold: true },
    { text: 'MUNICIPALITY OF BASCO - COMMUNITY TOOL & EQUIPMENT BANK (MCTEB)', bold: true },
    { text: 'OFFICIAL TRANSACTION & BORROWING RECEIPT', bold: true },
    { text: '============================================================================' },
    { text: `Transaction ID     : ${receipt.transactionId}` },
    { text: `Receipt Reference  : ${receipt.receiptReference}`, bold: true },
    { text: `Date & Time        : ${receipt.dateTimeFormatted}` },
    { text: `Payment Method     : ${receipt.paymentMethod}` },
    { text: `Transaction Status : ${receipt.transactionStatus}`, bold: true },
    { text: '----------------------------------------------------------------------------' },
    { text: 'BORROWER / USER INFORMATION', bold: true },
    { text: `Full Name          : ${receipt.borrowerName}` },
    { text: `Email              : ${receipt.borrowerEmail}` },
    { text: `Contact Phone      : ${receipt.borrowerPhone}` },
    { text: `Location           : Brgy. ${receipt.borrowerBarangay}, ${receipt.borrowerProvince}` },
    { text: `Age                : ${receipt.borrowerAge}` },
    { text: '----------------------------------------------------------------------------' },
    { text: 'BORROWING SCHEDULE', bold: true },
    { text: `Borrowing Duration : ${receipt.durationDays} day(s)` },
    { text: `Return Schedule    : ${receipt.returnScheduleLabel}` },
    { text: '----------------------------------------------------------------------------' },
    { text: 'REQUESTED TOOLS / EQUIPMENT', bold: true },
  ];

  receipt.items.forEach((item, index) => {
    lines.push({
      text: `${index + 1}. ${item.tool_name} (Qty: ${item.quantity})`,
      bold: true,
    });
    lines.push({
      text: `   Unit Rate: ${formatPdfPHP(item.unit_cost_centavos)}/day | Deposit: ${formatPdfPHP(item.deposit_fee_centavos)} | Subtotal: ${formatPdfPHP(item.subtotal_centavos)}`,
    });
  });

  lines.push({ text: '----------------------------------------------------------------------------' });
  lines.push({ text: `TOTAL AMOUNT       : ${formatPdfPHP(receipt.totalAmountCentavos)}`, bold: true });
  lines.push({ text: `Processed / Verified By: ${receipt.verifierName}` });
  lines.push({ text: '----------------------------------------------------------------------------' });
  lines.push({ text: 'REMARKS / NOTES:', bold: true });

  for (const wrapped of wrapLine(receipt.remarks, 74)) {
    lines.push({ text: `  ${wrapped}` });
  }

  lines.push({ text: '============================================================================' });
  lines.push({ text: 'Generated by MCTEB Digital Portal - Municipality of Basco, Batanes' });

  return lines;
}

export function generateReceiptPdfBytes(payment: PaymentReceiptSource): Uint8Array {
  const receipt = normalizeReceiptData(payment);
  const lines = buildReceiptLines(receipt);

  const ops: string[] = ['BT'];
  let y = 755;
  for (const line of lines) {
    if (y < 45) break;
    const font = line.bold ? '/F2' : '/F1';
    const fontSize = line.bold ? 10 : 9.5;
    ops.push(`${font} ${fontSize} Tf`);
    ops.push(`1 0 0 1 42 ${y} Tm`);
    ops.push(`(${sanitizePdfText(line.text)}) Tj`);
    y -= 15;
  }
  ops.push('ET');

  const contentStream = ops.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function generateReceiptPdfBlob(payment: PaymentReceiptSource): Blob {
  const bytes = generateReceiptPdfBytes(payment);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}

export function downloadReceiptPdf(payment: PaymentReceiptSource): void {
  const blob = generateReceiptPdfBlob(payment);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MCTEB-Receipt-${payment.receipt_reference}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
