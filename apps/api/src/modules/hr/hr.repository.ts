import db from '../../db/client.js';
import type { User } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export class HrRepository {
  static listStaff(): User[] {
    const stmt = db.prepare(`
      SELECT id, full_name, email, phone, birth_date, age, province, profile_picture_url, avatar_url, is_age_verified, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
      FROM users
      WHERE role IN ('Municipal Staff', 'Staff', 'Administrator', 'Admin')
      ORDER BY role ASC, full_name ASC
    `);
    return stmt.all() as User[];
  }

  static createStaff(input: {
    full_name: string;
    email: string;
    phone: string;
    birth_date: string;
    age?: number;
    province?: string;
    barangay: string;
    address: string;
    role: 'Municipal Staff' | 'Staff' | 'Administrator' | 'Admin';
    passwordHash: string;
  }): User {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO users (
        id, full_name, email, password_hash, phone, birth_date, age, province, is_age_verified, barangay, address, role, status, failed_login_attempts
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'Active', 0)
      RETURNING id, full_name, email, phone, birth_date, age, province, profile_picture_url, avatar_url, is_age_verified, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);

    return stmt.get(
      id,
      input.full_name,
      input.email.toLowerCase(),
      input.passwordHash,
      input.phone,
      input.birth_date,
      input.age ?? 25,
      input.province ?? 'Batanes',
      input.barangay,
      input.address,
      input.role,
    ) as User;
  }

  static updateStaff(id: string, updates: { role?: string; status?: string }): User | null {
    const fields: string[] = [];
    const values: string[] = [];

    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = DATETIME('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, full_name, email, phone, birth_date, age, province, profile_picture_url, avatar_url, is_age_verified, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);

    return (stmt.get(...values) as User) || null;
  }
}

