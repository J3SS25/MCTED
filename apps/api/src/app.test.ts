import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { runMigrations } from './db/migrate.js';
import { runSeed } from './db/seed/seed.js';

beforeAll(async () => {
  runMigrations();
  await runSeed();
});

describe('MCTEB API Integration Tests', () => {
  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/tools returns public catalog items', async () => {
    const res = await request(app).get('/api/v1/tools');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/register rejects underage borrower registration (< 18)', async () => {
    const currentYear = new Date().getFullYear();
    const underageYear = currentYear - 15;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Teen Resident',
        email: `teen.${Date.now()}@example.com`,
        password: 'Password123!',
        phone: '09123456789',
        birth_date: `${underageYear}-05-01`,
        barangay: 'Chanarian',
        address: 'Sitio Disong, Basco',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/at least 18 years old/i);
  });

  it('POST /api/v1/auth/login succeeds with seeded demo borrower', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'borrower@basco.gov.ph',
        password: 'Basco@2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('borrower@basco.gov.ph');
    expect(res.body.user.role).toBe('Borrower');
  });

  it('Borrower cannot access admin-only users list (RBAC test)', async () => {
    // Login as Ana (Borrower)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'borrower@basco.gov.ph',
        password: 'Basco@2026!',
      });

    const token = loginRes.body.token;

    // Try accessing /api/v1/users (Admin only)
    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersRes.status).toBe(403);
  });

  it('Administrator can access admin users list', async () => {
    // Login as Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@basco.gov.ph',
        password: 'Basco@2026!',
      });

    const token = loginRes.body.token;

    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersRes.status).toBe(200);
    expect(Array.isArray(usersRes.body)).toBe(true);
  });

  it('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
  });

  it('Tool upload and self-removal by owner', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'borrower@basco.gov.ph', password: 'Basco@2026!' });
    const token = loginRes.body.token;

    // 1. Create tool
    const createRes = await request(app)
      .post('/api/v1/tools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cordless Drill Pro',
        category: 'Power Tools',
        description: 'Heavy duty brushless cordless drill',
        rental_fee_centavos: 25000,
        deposit_fee_centavos: 50000,
        total_quantity: 1,
        discount_percentage: 15,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.user_id).toBe(loginRes.body.user.id);
    const toolId = createRes.body.id;

    // 2. Self-removal by owner
    const deleteRes = await request(app)
      .delete(`/api/v1/tools/${toolId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);
  });

  it('Wishlist workflow: add, list, and remove saved items', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'borrower@basco.gov.ph', password: 'Basco@2026!' });
    const token = loginRes.body.token;

    // Get catalog tool
    const toolsRes = await request(app).get('/api/v1/tools');
    const toolId = toolsRes.body.items[0].id;

    // Add to wishlist
    const addRes = await request(app)
      .post('/api/v1/wishlists')
      .set('Authorization', `Bearer ${token}`)
      .send({ tool_id: toolId });

    expect(addRes.status).toBe(201);

    // List wishlist
    const listRes = await request(app)
      .get('/api/v1/wishlists')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.some((i: any) => i.tool_id === toolId)).toBe(true);

    // Remove from wishlist
    const removeRes = await request(app)
      .delete(`/api/v1/wishlists/${toolId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removeRes.status).toBe(204);
  });

  it('Borrow requests enforce self-borrow prevention and date conflict rules', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'borrower@basco.gov.ph', password: 'Basco@2026!' });
    const token = loginRes.body.token;

    // 1. Borrower uploads tool
    const toolRes = await request(app)
      .post('/api/v1/tools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Personal Angle Grinder',
        category: 'Power Tools',
        description: 'Angle grinder for tile cutting',
        rental_fee_centavos: 15000,
        deposit_fee_centavos: 30000,
        total_quantity: 1,
      });

    const ownToolId = toolRes.body.id;

    // 2. Borrower attempts to borrow own tool -> should be rejected (400)
    const selfBorrowRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        item_id: ownToolId,
        start_date: '2026-12-01',
        end_date: '2026-12-05',
        request_message: 'Testing self borrow',
      });

    expect(selfBorrowRes.status).toBe(400);
    expect(selfBorrowRes.body.error.message).toMatch(/cannot borrow your own/i);
  });

  it('Simulated mock payments (GCash/Maya/BDO/Landbank) and detailed receipts', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'borrower@basco.gov.ph', password: 'Basco@2026!' });
    const token = loginRes.body.token;

    // Checkout with GCash
    const checkoutRes = await request(app)
      .post('/api/v1/payments/mock-checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount_centavos: 50000,
        payment_method: 'GCash',
        account_number: '09171234567',
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.status).toBe('Paid');
    expect(checkoutRes.body.receipt_reference).toContain('BASCO-GCASH');
    expect(checkoutRes.body.gateway_reference).toBeDefined();

    const paymentId = checkoutRes.body.id;

    // Fetch official printable receipt
    const receiptRes = await request(app)
      .get(`/api/v1/payments/${paymentId}/receipt`)
      .set('Authorization', `Bearer ${token}`);

    expect(receiptRes.status).toBe(200);
    expect(receiptRes.body).toHaveProperty('receipt_number');
    expect(receiptRes.body).toHaveProperty('formatted_total');
    expect(receiptRes.body.payer.id).toBe(loginRes.body.user.id);
  });

  it('HR module: list staff and manage staff roles', async () => {
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@basco.gov.ph', password: 'Basco@2026!' });
    const token = adminLogin.body.token;

    const hrRes = await request(app)
      .get('/api/v1/hr/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(hrRes.status).toBe(200);
    expect(Array.isArray(hrRes.body)).toBe(true);
    expect(hrRes.body.length).toBeGreaterThan(0);
  });
});

