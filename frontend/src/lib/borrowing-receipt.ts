export type ReceiptConditionOption = 'Good' | 'Fair' | 'Damaged' | '';

export interface BorrowingReceiptStatusFlags {
  Borrowed: boolean;
  Returned: boolean;
  Overdue: boolean;
  Damaged: boolean;
  Lost: boolean;
}

export interface BorrowingReceiptData {
  receiptNo: string;

  // 1. Organization/School/Company Information
  showLogo: boolean;
  orgLogoUrl: string;
  orgName: string;
  orgAddress: string;
  orgContact: string;

  // 2. Borrower Information
  borrowerFullName: string;
  borrowerId: string;
  borrowerDepartment: string;
  borrowerContact: string;
  borrowerSignature: string;

  // 3. Tool/Equipment Information
  toolName: string;
  serialNumber: string;
  quantity: string;
  conditionBefore: ReceiptConditionOption;
  toolRemarks: string;

  // 4. Borrowing Schedule
  dateBorrowed: string;
  expectedReturnDate: string;

  // 5. Return Details
  actualReturnDate: string;
  conditionUponReturn: ReceiptConditionOption;
  receivedBy: string;
  returnRemarks: string;

  // 6. Status Section
  status: BorrowingReceiptStatusFlags;

  // 8. Approval Section
  approvalBorrowerSignature: string;
  authorizedPersonnelSignature: string;
  dateSigned: string;
}

export const RECEIPT_WARNING_TEXT = {
  heading: 'WARNING:',
  paragraphs: [
    'The borrower is fully responsible for the borrowed tool/equipment during the borrowing period.',
    'If any tool or equipment is broken, damaged, lost, misused, or returned in poor condition, corresponding penalties and fees may apply based on the severity of the damage. The exact fees will be discussed and settled in person with the responsible authority.',
    'Failure to return the equipment on the scheduled date may result in additional sanctions and temporary suspension of borrowing privileges.',
    'By signing this receipt, the borrower acknowledges and agrees to comply with all borrowing policies, responsibilities, and penalties.',
  ],
} as const;

export const DEFAULT_ORGANIZATION_INFO = {
  showLogo: true,
  orgLogoUrl: '/favicon.svg',
  orgName: 'Municipal Community Tool and Equipment Bank (MCTEB)',
  orgAddress: 'Municipality of Basco, Province of Batanes 3900',
  orgContact: 'mcteb@basco.gov.ph | (078) 555-0142',
} as const;

export function mapConditionToReceiptOption(raw?: string | null): ReceiptConditionOption {
  if (!raw) return '';
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'excellent' || normalized === 'good') return 'Good';
  if (normalized === 'fair') return 'Fair';
  if (
    normalized === 'damaged' ||
    normalized === 'needs repair' ||
    normalized === 'under maintenance'
  ) {
    return 'Damaged';
  }
  return '';
}

function extractIsoDate(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (isoMatch?.[1]) return isoMatch[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

export function createBlankBorrowingReceipt(): BorrowingReceiptData {
  return {
    receiptNo: '',
    showLogo: DEFAULT_ORGANIZATION_INFO.showLogo,
    orgLogoUrl: DEFAULT_ORGANIZATION_INFO.orgLogoUrl,
    orgName: DEFAULT_ORGANIZATION_INFO.orgName,
    orgAddress: DEFAULT_ORGANIZATION_INFO.orgAddress,
    orgContact: DEFAULT_ORGANIZATION_INFO.orgContact,
    borrowerFullName: '',
    borrowerId: '',
    borrowerDepartment: '',
    borrowerContact: '',
    borrowerSignature: '',
    toolName: '',
    serialNumber: '',
    quantity: '1',
    conditionBefore: '',
    toolRemarks: '',
    dateBorrowed: '',
    expectedReturnDate: '',
    actualReturnDate: '',
    conditionUponReturn: '',
    receivedBy: '',
    returnRemarks: '',
    status: {
      Borrowed: false,
      Returned: false,
      Overdue: false,
      Damaged: false,
      Lost: false,
    },
    approvalBorrowerSignature: '',
    authorizedPersonnelSignature: '',
    dateSigned: '',
  };
}

export function createDefaultBorrowingReceipt(
  source?: Record<string, unknown> | null,
): BorrowingReceiptData {
  if (!source) {
    return createBlankBorrowingReceipt();
  }

  const str = (key: string): string => {
    const val = source[key];
    return typeof val === 'string' ? val : typeof val === 'number' ? String(val) : '';
  };

  const id = str('id');
  const userId = str('user_id');
  const statusRaw = str('status');
  const dueDateRaw = str('due_date') || str('return_date');
  const pickupDateRaw = str('pickup_date') || str('created_at');
  const returnedAtRaw = str('returned_at');

  const conditionBefore = mapConditionToReceiptOption(
    str('initial_condition') || str('tool_condition_status'),
  );
  const conditionUponReturn = mapConditionToReceiptOption(str('returned_condition'));

  const isReturned = statusRaw === 'Returned' || statusRaw === 'Completed';
  const isBorrowed = statusRaw === 'Borrowed' || statusRaw === 'Approved';
  const dueTimestamp = dueDateRaw ? new Date(dueDateRaw).getTime() : Number.NaN;
  const isOverdue =
    isBorrowed && !Number.isNaN(dueTimestamp) && dueTimestamp < Date.now();
  const isDamaged = conditionUponReturn === 'Damaged';

  const barangay = str('borrower_barangay');
  const department = barangay ? `Brgy. ${barangay}` : '';
  const borrowerName = str('borrower_name');

  const purpose = str('purpose');
  const staffNotes = str('staff_notes');
  const toolRemarks =
    purpose && staffNotes ? `${purpose} (Staff Note: ${staffNotes})` : purpose || staffNotes;

  const dateBorrowed = extractIsoDate(pickupDateRaw);
  const dateSigned =
    extractIsoDate(str('reviewed_at')) || dateBorrowed || extractIsoDate(str('created_at'));

  return {
    receiptNo: id ? `TBR-${id.slice(0, 8).toUpperCase()}` : '',
    showLogo: DEFAULT_ORGANIZATION_INFO.showLogo,
    orgLogoUrl: DEFAULT_ORGANIZATION_INFO.orgLogoUrl,
    orgName: DEFAULT_ORGANIZATION_INFO.orgName,
    orgAddress: DEFAULT_ORGANIZATION_INFO.orgAddress,
    orgContact: DEFAULT_ORGANIZATION_INFO.orgContact,
    borrowerFullName: borrowerName,
    borrowerId: userId ? `MCTEB-${userId.slice(0, 8).toUpperCase()}` : '',
    borrowerDepartment: department,
    borrowerContact: str('borrower_phone') || str('borrower_email'),
    borrowerSignature: '',
    toolName: str('tool_name'),
    serialNumber: str('tool_serial_number'),
    quantity: str('quantity') || '1',
    conditionBefore,
    toolRemarks,
    dateBorrowed,
    expectedReturnDate: extractIsoDate(dueDateRaw),
    actualReturnDate: extractIsoDate(returnedAtRaw),
    conditionUponReturn,
    receivedBy: str('received_by_name'),
    returnRemarks: str('inspection_notes'),
    status: {
      Borrowed: isBorrowed,
      Returned: isReturned,
      Overdue: isOverdue,
      Damaged: isDamaged,
      Lost: statusRaw === 'Lost',
    },
    approvalBorrowerSignature: '',
    authorizedPersonnelSignature: str('released_by_name') || str('reviewed_by_name'),
    dateSigned,
  };
}

function sanitizePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfText(text: string, maxChars: number): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [''];
  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fieldValue(value: string, placeholder = '__________________________'): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : placeholder;
}

function checkboxMark(checked: boolean, label: string): string {
  return `${checked ? '[X]' : '[ ]'} ${label}`;
}

export function generateBorrowingReceiptPdfBytes(data: BorrowingReceiptData): Uint8Array {
  const pageWidth = 595.28; // A4 width in pt
  const pageHeight = 841.89; // A4 height in pt
  const left = 36;
  const right = pageWidth - 36;
  const width = right - left;

  const ops: string[] = [];
  let y = pageHeight - 36;

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    options?: { bold?: boolean; size?: number; color?: [number, number, number] },
  ) => {
    const font = options?.bold ? '/F2' : '/F1';
    const size = options?.size ?? 9;
    const [r, g, b] = options?.color ?? [0.06, 0.09, 0.16];
    ops.push('BT');
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${font} ${size} Tf`);
    ops.push(`1 0 0 1 ${x.toFixed(2)} ${yPos.toFixed(2)} Tm`);
    ops.push(`(${sanitizePdfText(text)}) Tj`);
    ops.push('ET');
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, gray = 0.78, lw = 0.6) => {
    ops.push('q');
    ops.push(`${gray} G`);
    ops.push(`${lw} w`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    ops.push('Q');
  };

  const drawRect = (
    x: number,
    yBottom: number,
    w: number,
    h: number,
    options?: { fill?: [number, number, number]; stroke?: [number, number, number]; lw?: number },
  ) => {
    ops.push('q');
    if (options?.fill) {
      ops.push(
        `${options.fill[0].toFixed(3)} ${options.fill[1].toFixed(3)} ${options.fill[2].toFixed(3)} rg`,
      );
    }
    if (options?.stroke) {
      ops.push(
        `${options.stroke[0].toFixed(3)} ${options.stroke[1].toFixed(3)} ${options.stroke[2].toFixed(3)} RG`,
      );
      ops.push(`${options.lw ?? 0.7} w`);
    }
    ops.push(`${x.toFixed(2)} ${yBottom.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (options?.fill && options?.stroke) ops.push('B');
    else if (options?.fill) ops.push('f');
    else ops.push('S');
    ops.push('Q');
  };

  const drawSectionHeader = (title: string) => {
    y -= 4;
    drawRect(left, y - 14, width, 16, {
      fill: [0.93, 0.96, 0.95],
      stroke: [0.75, 0.83, 0.8],
      lw: 0.5,
    });
    drawText(title, left + 6, y - 9.5, { bold: true, size: 8.5, color: [0.08, 0.25, 0.18] });
    y -= 24;
  };

  // Document Title Banner
  drawRect(left, y - 36, width, 38, {
    fill: [0.11, 0.26, 0.2],
  });
  drawText('TOOL BORROWING RECEIPT FORM', left + 12, y - 16, {
    bold: true,
    size: 13,
    color: [1, 1, 1],
  });
  drawText(
    `Receipt No.: ${fieldValue(data.receiptNo, '________________')}`,
    right - 175,
    y - 16,
    { bold: true, size: 9, color: [0.85, 0.95, 0.9] },
  );
  drawText('Official Digital Soft Copy & Printable A4 Hard Copy Record', left + 12, y - 29, {
    size: 8,
    color: [0.82, 0.92, 0.87],
  });
  y -= 48;

  // 1. Organization/School/Company Information
  drawSectionHeader('1. ORGANIZATION / SCHOOL / COMPANY INFORMATION');
  drawText(`Organization Name : ${fieldValue(data.orgName)}`, left + 6, y, { bold: true, size: 9 });
  y -= 14;
  drawText(`Address           : ${fieldValue(data.orgAddress)}`, left + 6, y, { size: 8.5 });
  y -= 14;
  drawText(`Contact Info      : ${fieldValue(data.orgContact)}`, left + 6, y, { size: 8.5 });
  y -= 14;

  // 2. Borrower Information
  drawSectionHeader('2. BORROWER INFORMATION');
  drawText(`Full Name          : ${fieldValue(data.borrowerFullName)}`, left + 6, y, { size: 8.5 });
  drawText(`Student/Employee ID: ${fieldValue(data.borrowerId, '__________________')}`, left + 275, y, {
    size: 8.5,
  });
  y -= 14;
  drawText(`Department/Course  : ${fieldValue(data.borrowerDepartment)}`, left + 6, y, { size: 8.5 });
  drawText(`Contact Number     : ${fieldValue(data.borrowerContact, '__________________')}`, left + 275, y, {
    size: 8.5,
  });
  y -= 14;
  drawText(
    `Borrower Signature : ${fieldValue(data.borrowerSignature, '________________________________________')}`,
    left + 6,
    y,
    { size: 8.5 },
  );
  y -= 14;

  // 3. Tool/Equipment Information
  drawSectionHeader('3. TOOL / EQUIPMENT INFORMATION');
  drawText(`Tool/Equipment Name: ${fieldValue(data.toolName)}`, left + 6, y, { size: 8.5 });
  drawText(`Serial No.: ${fieldValue(data.serialNumber, 'N/A / ______________')}`, left + 310, y, {
    size: 8.5,
  });
  y -= 14;
  drawText(`Quantity           : ${fieldValue(data.quantity, '____')}`, left + 6, y, { size: 8.5 });
  drawText(
    `Condition Before Borrowing:  ${checkboxMark(data.conditionBefore === 'Good', 'Good')}   ${checkboxMark(data.conditionBefore === 'Fair', 'Fair')}   ${checkboxMark(data.conditionBefore === 'Damaged', 'Damaged')}`,
    left + 150,
    y,
    { size: 8.5 },
  );
  y -= 14;
  for (const line of wrapPdfText(
    `Remarks            : ${fieldValue(data.toolRemarks, '________________________________________________________________')}`,
    96,
  ).slice(0, 2)) {
    drawText(line, left + 6, y, { size: 8.5 });
    y -= 13;
  }

  // 4. Borrowing Schedule
  drawSectionHeader('4. BORROWING SCHEDULE');
  drawText(`Date Borrowed      : ${fieldValue(data.dateBorrowed, '__________________')}`, left + 6, y, {
    size: 8.5,
  });
  drawText(
    `Expected Return Date: ${fieldValue(data.expectedReturnDate, '_________________')}`,
    left + 275,
    y,
    { size: 8.5 },
  );
  y -= 14;

  // 5. Return Details
  drawSectionHeader('5. RETURN DETAILS');
  drawText(
    `Actual Return Date : ${fieldValue(data.actualReturnDate, '__________________')}`,
    left + 6,
    y,
    { size: 8.5 },
  );
  y -= 14;
  drawText(
    `Condition Upon Return:  ${checkboxMark(data.conditionUponReturn === 'Good', 'Good')}   ${checkboxMark(data.conditionUponReturn === 'Fair', 'Fair')}   ${checkboxMark(data.conditionUponReturn === 'Damaged', 'Damaged')}`,
    left + 6,
    y,
    { size: 8.5 },
  );
  y -= 14;
  drawText(`Received By        : ${fieldValue(data.receivedBy)}`, left + 6, y, { size: 8.5 });
  y -= 14;
  for (const line of wrapPdfText(
    `Remarks            : ${fieldValue(data.returnRemarks, '________________________________________________________________')}`,
    96,
  ).slice(0, 2)) {
    drawText(line, left + 6, y, { size: 8.5 });
    y -= 13;
  }

  // 6. Status Section
  drawSectionHeader('6. STATUS SECTION');
  const statusLine = [
    checkboxMark(data.status.Borrowed, 'Borrowed'),
    checkboxMark(data.status.Returned, 'Returned'),
    checkboxMark(data.status.Overdue, 'Overdue'),
    checkboxMark(data.status.Damaged, 'Damaged'),
    checkboxMark(data.status.Lost, 'Lost'),
  ].join('      ');
  drawText(statusLine, left + 6, y, { bold: true, size: 9 });
  y -= 16;

  // 7. Terms, Warnings, and Penalties
  drawSectionHeader('7. TERMS, WARNINGS, AND PENALTIES');
  const warningLines: Array<{ text: string; bold?: boolean }> = [{ text: RECEIPT_WARNING_TEXT.heading, bold: true }];
  for (const para of RECEIPT_WARNING_TEXT.paragraphs) {
    for (const wrapped of wrapPdfText(para, 102)) {
      warningLines.push({ text: wrapped });
    }
  }
  const warningBoxHeight = warningLines.length * 11 + 10;
  drawRect(left, y - warningBoxHeight + 8, width, warningBoxHeight, {
    fill: [1, 0.97, 0.93],
    stroke: [0.85, 0.55, 0.3],
    lw: 0.7,
  });
  let wy = y - 3;
  for (const wLine of warningLines) {
    drawText(wLine.text, left + 8, wy, {
      bold: wLine.bold,
      size: wLine.bold ? 8.5 : 8,
      color: wLine.bold ? [0.65, 0.12, 0.12] : [0.22, 0.16, 0.12],
    });
    wy -= 11;
  }
  y -= warningBoxHeight + 2;

  // 8. Approval Section
  drawSectionHeader('8. APPROVAL SECTION');
  const sigY = y - 18;
  drawText(
    data.approvalBorrowerSignature.trim() || data.borrowerSignature.trim(),
    left + 12,
    sigY + 4,
    { size: 8.5 },
  );
  drawLine(left + 6, sigY, left + 175, sigY, 0.35, 0.8);
  drawText("Borrower's Signature", left + 38, sigY - 11, { bold: true, size: 8 });

  drawText(data.authorizedPersonnelSignature.trim(), left + 195, sigY + 4, { size: 8.5 });
  drawLine(left + 190, sigY, left + 385, sigY, 0.35, 0.8);
  drawText('Authorized Personnel Signature', left + 220, sigY - 11, { bold: true, size: 8 });

  drawText(data.dateSigned.trim(), left + 412, sigY + 4, { size: 8.5 });
  drawLine(left + 402, sigY, right - 6, sigY, 0.35, 0.8);
  drawText('Date Signed', left + 435, sigY - 11, { bold: true, size: 8 });

  // Footer
  drawLine(left, 34, right, 34, 0.85, 0.5);
  drawText(
    'Tool Borrowing Receipt Form - Valid as Digital Soft Copy & Printable A4 Hard Copy',
    left,
    22,
    { size: 7.5, color: [0.4, 0.45, 0.52] },
  );

  const contentStream = ops.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
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

export function generateBorrowingReceiptPdfBlob(data: BorrowingReceiptData): Blob {
  const bytes = generateBorrowingReceiptPdfBytes(data);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buffer], { type: 'application/pdf' });
}

export function downloadBorrowingReceiptPdf(data: BorrowingReceiptData): void {
  const blob = generateBorrowingReceiptPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeRef = (data.receiptNo || 'Form')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-');
  link.href = url;
  link.download = `Tool-Borrowing-Receipt-${safeRef}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
