import db from '../../db/client.js';
import type { User, UpdateProfileInput } from '@mcteb/shared';

export class UsersRepository {
  static findById(id: string): User | null {
    const stmt = db.prepare(`
      SELECT id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
      FROM users
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as User) || null;
  }

  static findAll(): User[] {
    const stmt = db.prepare(`
      SELECT id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
      FROM users
      ORDER BY datetime(created_at) DESC
    `);
    return stmt.all() as User[];
  }

  static countActiveAdmins(): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'Administrator' AND status = 'Active'
    `);
    const row = stmt.get() as { count: number };
    return row ? row.count : 0;
  }

  static updateProfile(id: string, input: UpdateProfileInput): User | null {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (input.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(input.full_name);
    }
    if (input.phone !== undefined) {
      fields.push('phone = ?');
      values.push(input.phone);
    }
    if (input.barangay !== undefined) {
      fields.push('barangay = ?');
      values.push(input.barangay);
    }
    if (input.address !== undefined) {
      fields.push('address = ?');
      values.push(input.address);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = DATETIME('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);

    return (stmt.get(...values) as User) || null;
  }

  static updateStatus(id: string, status: string): User | null {
    const stmt = db.prepare(`
      UPDATE users
      SET status = ?, updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);
    return (stmt.get(status, id) as User) || null;
  }

  static updateRole(id: string, role: string): User | null {
    const stmt = db.prepare(`
      UPDATE users
      SET role = ?, updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);
    return (stmt.get(role, id) as User) || null;
  }
}

