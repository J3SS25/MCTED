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
});

