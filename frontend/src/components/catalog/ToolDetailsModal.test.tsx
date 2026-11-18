import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ToolDetailsModal } from './ToolDetailsModal.js';
import type { Tool } from '@mcteb/shared';

vi.mock('../../lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'a0000000-0000-4000-8000-000000000003',
      full_name: 'Ana Reyes',
      role: 'Borrower',
    },
  }),
}));

vi.mock('../../lib/wishlist-cart-context', () => ({
  useWishlistCart: () => ({
    isInWishlist: () => false,
    isInCart: () => false,
    toggleWishlist: () => true,
    addToCart: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

const SAMPLE_TOOL: Tool = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Makita Cordless Hammer Drill',
  category: 'Carpentry',
  description: 'Heavy-duty 18V cordless hammer drill with two batteries.',
  specifications: '18V Li-Ion, 13mm chuck',
  availability_status: 'Available',
  condition_status: 'Excellent',
  rental_fee_centavos: 15000,
  deposit_fee_centavos: 50000,
  total_quantity: 2,
  available_quantity: 2,
  serial_number: 'MKT-2026-901',
  image_url: '/equipment/circular-saw.svg',
  image_urls: ['/equipment/circular-saw.svg', '/equipment/tiller.svg', '/equipment/generator.svg'],
  owner_id: 'a0000000-0000-4000-8000-000000000003',
  owner_name: 'Ana Reyes',
  owner_role: 'Borrower',
  owner_barangay: 'Barangay III',
  discount_percent: 0,
  created_at: '2026-11-10T08:30:00.000Z',
  updated_at: '2026-11-10T08:30:00.000Z',
};

describe('ToolDetailsModal', () => {
  it('displays all 10 required tool details and multi-image carousel navigation', () => {
    render(
      <MemoryRouter>
        <ToolDetailsModal isOpen={true} onClose={vi.fn()} tool={SAMPLE_TOOL} canManage={false} />
      </MemoryRouter>,
    );

    // 1. Tool Name
    expect(screen.getAllByText('Makita Cordless Hammer Drill').length).toBeGreaterThan(0);
    // 2. Category
    expect(screen.getAllByText('Carpentry').length).toBeGreaterThan(0);
    // 3. Description
    expect(
      screen.getByText('Heavy-duty 18V cordless hammer drill with two batteries.'),
    ).toBeDefined();
    // 4. Serial ID Number
    expect(screen.getByText('MKT-2026-901')).toBeDefined();
    // 5. Condition
    expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0);
    // 6. Quantity
    expect(screen.getByText('2 Available / 2 Total Unit(s)')).toBeDefined();
    // 7. Availability Status
    expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
    // 8. Uploaded Images (3 images carousel)
    expect(screen.getByText('Uploaded Images (3)')).toBeDefined();
    expect(screen.getByText('1 / 3')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('2 / 3')).toBeDefined();
    // 9. Upload Date
    expect(screen.getByText(/Nov 10, 2026/i)).toBeDefined();
    // 10. Owner Information
    expect(screen.getByText(/Ana Reyes \(Borrower • Brgy\. Barangay III\)/)).toBeDefined();

    // Non-managed catalog view hides Edit/Delete
    expect(screen.queryByRole('button', { name: /^Edit$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Delete$/i })).toBeNull();
  });

  it('shows Edit and Delete buttons only when canManage is true', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <MemoryRouter>
        <ToolDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          tool={SAMPLE_TOOL}
          canManage={true}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );

    const editBtn = screen.getByRole('button', { name: /Edit/i });
    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    expect(editBtn).toBeDefined();
    expect(deleteBtn).toBeDefined();

    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(SAMPLE_TOOL);
  });
});
