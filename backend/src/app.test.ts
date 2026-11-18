import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { runMigrations } from '../db/migrate.js';
import { runSeed } from '../db/seed/seed.js';

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
    const res = await request(app).post('/api/v1/auth/login').send({
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
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'borrower@basco.gov.ph',
      password: 'Basco@2026!',
    });

    const token = loginRes.body.token as string;

    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersRes.status).toBe(403);
  });

  it('Administrator can access admin users list', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@basco.gov.ph',
      password: 'Basco@2026!',
    });

    const token = loginRes.body.token as string;

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

  it('Borrower cannot upload, edit, or delete tools (403), while Municipal Staff can create, edit, and delete catalog tools', async () => {
    const borrowerLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'borrower@basco.gov.ph',
      password: 'Basco@2026!',
    });
    const borrowerToken = borrowerLoginRes.body.token as string;

    // 1. Borrower cannot create a tool
    const forbiddenCreate = await request(app)
      .post('/api/v1/tools')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        name: 'Borrower Unauthorized Drill',
        category: 'Carpentry',
        description: 'Borrowers are not allowed to upload tools.',
        total_quantity: 1,
      });
    expect(forbiddenCreate.status).toBe(403);

    // 2. Borrower cannot update a municipal tool
    const forbiddenPatch = await request(app)
      .patch('/api/v1/tools/b0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ name: 'Hijacked Tool' });
    expect(forbiddenPatch.status).toBe(403);

    // 3. Borrower cannot delete a municipal tool
    const forbiddenDelete = await request(app)
      .delete('/api/v1/tools/b0000000-0000-4000-8000-000000000001')
      .set('Authorization', `Bearer ${borrowerToken}`);
    expect(forbiddenDelete.status).toBe(403);

    // 4. Municipal Staff CAN create, edit, and delete catalog tools
    const staffLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'staff@basco.gov.ph',
      password: 'Basco@2026!',
    });
    const staffToken = staffLoginRes.body.token as string;

    const createRes = await request(app)
      .post('/api/v1/tools')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Staff Cordless Drill',
        category: 'Carpentry',
        description: '18V cordless hammer drill managed by municipal staff.',
        total_quantity: 1,
        image_url:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.owner_id).toBe(staffLoginRes.body.user.id);
    const createdToolId = createRes.body.id;

    // 5. Staff edits the created tool
    const editRes = await request(app)
      .patch(`/api/v1/tools/${createdToolId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Staff Cordless Drill Pro', availability_status: 'Reserved' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.name).toBe('Staff Cordless Drill Pro');
    expect(editRes.body.availability_status).toBe('Reserved');

    // 6. Staff deletes the created tool
    const deleteRes = await request(app)
      .delete(`/api/v1/tools/${createdToolId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    const getDeleted = await request(app).get(`/api/v1/tools/${createdToolId}`);
    expect(getDeleted.status).toBe(404);
  });
});
