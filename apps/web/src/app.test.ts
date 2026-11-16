import { describe, it, expect } from 'vitest';
import { calculateAgeFromBirthDate, RegisterUserSchema, DEMO_PAYMENT_METHODS } from '@mcteb/shared';
import {
  generateReceiptPdfBytes,
  normalizeReceiptData,
  buildReceiptLines,
  type PaymentReceiptSource,
} from './lib/pdf-receipt';
import {
  getProfilePicture,
  setProfilePicture,
  getLocalToolImage,
  setLocalToolImage,
} from './lib/local-storage';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('MCTEB Web Unit Tests', () => {
  it('enforces 18+ age validation on borrower registration schema', () => {
    const today = new Date();
    const underageBirthYear = today.getFullYear() - 16;
    const adultBirthYear = today.getFullYear() - 21;

    expect(calculateAgeFromBirthDate(`${underageBirthYear}-01-01`, today)).toBeLessThan(18);

    const underageResult = RegisterUserSchema.safeParse({
      full_name: 'Minor Applicant',
      email: 'minor@example.com',
      password: 'Password123!',
      phone: '09171234567',
      birth_date: `${underageBirthYear}-01-01`,
      barangay: 'San Antonio',
      province: 'Batanes',
      address: 'Sitio Disong, Basco',
    });
    expect(underageResult.success).toBe(false);

    const adultResult = RegisterUserSchema.safeParse({
      full_name: 'Adult Applicant',
      email: 'adult@example.com',
      password: 'Password123!',
      phone: '09171234567',
      birth_date: `${adultBirthYear}-01-01`,
      age: 21,
      barangay: 'San Antonio',
      province: 'Batanes',
      address: 'Sitio Disong, Basco',
    });
    expect(adultResult.success).toBe(true);
  });

  it('includes all four required demo payment methods', () => {
    expect(DEMO_PAYMENT_METHODS).toEqual(['GCash', 'LANDBANK', 'Maya (PayMaya)', 'BDO']);
  });

  it('builds complete receipt metadata and generates valid PDF 1.4 bytes', () => {
    const mockPayment: PaymentReceiptSource = {
      id: 'tx-12345678-90ab-cdef-1234-567890abcdef',
      receipt_reference: 'BASCO-PAY-2026-999001',
      amount_centavos: 260000,
      payment_method: 'Maya (PayMaya)',
      status: 'Paid',
      created_at: '2026-11-16T10:15:00.000Z',
      payer_name: 'Ana Reyes',
      payer_email: 'borrower@basco.gov.ph',
      payer_phone: '+639191234567',
      payer_barangay: 'San Antonio',
      payer_province: 'Batanes',
      payer_age: 31,
      pickup_date: '2026-11-17',
      return_date: '2026-11-19',
      duration_days: 3,
      remarks: 'Farm tillage and drainage work',
      items_json: JSON.stringify([
        {
          tool_id: 'tool-1',
          tool_name: 'Agricultural Hand Tiller',
          category: 'Agriculture',
          quantity: 2,
          unit_cost_centavos: 40000,
          deposit_fee_centavos: 20000,
          duration_days: 3,
          subtotal_centavos: 260000,
        },
      ]),
    };

    const normalized = normalizeReceiptData(mockPayment);
    expect(normalized.transactionId).toBe(mockPayment.id);
    expect(normalized.receiptReference).toBe('BASCO-PAY-2026-999001');
    expect(normalized.borrowerProvince).toBe('Batanes');
    expect(normalized.durationDays).toBe(3);
    expect(normalized.items).toHaveLength(1);
    expect(normalized.items[0]?.quantity).toBe(2);

    const linesText = buildReceiptLines(normalized)
      .map((l) => l.text)
      .join('\n');
    expect(linesText).toContain('tx-12345678-90ab-cdef-1234-567890abcdef');
    expect(linesText).toContain('Maya (PayMaya)');
    expect(linesText).toContain('Agricultural Hand Tiller');
    expect(linesText).toContain('3 day(s)');
    expect(linesText).toContain('Farm tillage and drainage work');

    const pdfBytes = generateReceiptPdfBytes(mockPayment);
    const pdfText = new TextDecoder().decode(pdfBytes);
    expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfText.endsWith('%%EOF')).toBe(true);
    expect(pdfText).toContain('BASCO-PAY-2026-999001');
  });

  it('persists profile pictures and tool images in local storage', () => {
    const storage = createMemoryStorage();
    const userId = 'user-1';
    const toolId = 'tool-1';
    const avatarData = 'data:image/jpeg;base64,/9j/4AAQ';
    const toolImageData = 'data:image/png;base64,iVBOR';

    expect(getProfilePicture(userId, storage)).toBeNull();
    setProfilePicture(userId, avatarData, storage);
    expect(getProfilePicture(userId, storage)).toBe(avatarData);
    setProfilePicture(userId, null, storage);
    expect(getProfilePicture(userId, storage)).toBeNull();

    setLocalToolImage(toolId, toolImageData, storage);
    expect(getLocalToolImage(toolId, storage)).toBe(toolImageData);
  });
});
