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

  it('POST /api/v1/auth/register accepts 18+ borrower with province and age', async () => {
    const adultYear = new Date().getFullYear() - 22;
    const email = `adult.${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Carlos Mendoza',
        email,
        password: 'Password123!',
        phone: '09171112233',
        birth_date: `${adultYear}-04-10`,
        age: 22,
        barangay: 'San Antonio',
        province: 'Batanes',
        address: 'National Road, Basco, Batanes',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.province).toBe('Batanes');
    expect(res.body.user.age).toBe(22);
  });

  it('Borrower can upload, edit, and delete their own tool without staff approval, but cannot edit municipal tools', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'borrower@basco.gov.ph',
        password: 'Basco@2026!',
      });
    const token = loginRes.body.token;

    // 1. Borrower cannot update a municipal tool owned by the system (owner_id = null)
    const forbiddenPatch = await request(app)
      .patch('/api/v1/tools/b0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hijacked Tool' });
    expect(forbiddenPatch.status).toBe(403);

    // 2. Borrower uploads their own tool with image & discount
    const createRes = await request(app)
      .post('/api/v1/tools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Borrower Cordless Drill',
        category: 'Carpentry',
        description: '18V cordless hammer drill shared by community member.',
        rental_fee_centavos: 15000,
        deposit_fee_centavos: 50000,
        discount_percent: 10,
        total_quantity: 1,
        image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.owner_id).toBe(loginRes.body.user.id);
    expect(createRes.body.discount_percent).toBe(10);
    const createdToolId = createRes.body.id;

    // 3. Borrower edits their own tool
    const editRes = await request(app)
      .patch(`/api/v1/tools/${createdToolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Borrower Cordless Drill Pro', availability_status: 'Reserved' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.name).toBe('Borrower Cordless Drill Pro');
    expect(editRes.body.availability_status).toBe('Reserved');

    // 4. Borrower deletes their own tool without staff/admin approval
    const deleteRes = await request(app)
      .delete(`/api/v1/tools/${createdToolId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    const getDeleted = await request(app).get(`/api/v1/tools/${createdToolId}`);
    expect(getDeleted.status).toBe(404);
  });

  it('POST /api/v1/payments supports demo payment methods (GCash, LANDBANK, Maya (PayMaya), BDO) and receipt metadata', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'borrower@basco.gov.ph',
        password: 'Basco@2026!',
      });
    const token = loginRes.body.token;

    for (const method of ['GCash', 'LANDBANK', 'Maya (PayMaya)', 'BDO']) {
      const payRes = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tool_id: 'b0000000-0000-4000-8000-000000000001',
          amount_centavos: 150000,
          payment_method: method,
          status: 'Paid',
          pickup_date: '2026-11-20',
          return_date: '2026-11-22',
          duration_days: 3,
          remarks: `Demo payment via ${method}`,
          items_json: JSON.stringify([
            {
              tool_id: 'b0000000-0000-4000-8000-000000000001',
              tool_name: 'Agricultural Hand Tiller',
              quantity: 1,
              unit_cost_centavos: 50000,
              deposit_fee_centavos: 0,
              duration_days: 3,
              subtotal_centavos: 150000,
            },
          ]),
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.payment_method).toBe(method);
      expect(payRes.body.status).toBe('Paid');
      expect(payRes.body.duration_days).toBe(3);
      expect(payRes.body.payer_province).toBeDefined();
      expect(payRes.body.items_json).toContain('Agricultural Hand Tiller');
    }
  });
});

