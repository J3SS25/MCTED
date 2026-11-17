import db from '../../db/client.js';
import type { User, UpdateProfileInput } from '@mcteb/shared';

const USER_PUBLIC_COLUMNS =
  'id, full_name, email, phone, birth_date, barangay, province, age, avatar_url, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at';

export class UsersRepository {
  static findById(id: string): User | null {
    const stmt = db.prepare(`
      SELECT ${USER_PUBLIC_COLUMNS}
      FROM users
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as User) || null;
  }

  static findAll(): User[] {
    const stmt = db.prepare(`
      SELECT ${USER_PUBLIC_COLUMNS}
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

  static findStaffAndAdminIds(): string[] {
    const rows = db
      .prepare<{
        id: string;
      }>(
        "SELECT id FROM users WHERE role IN ('Municipal Staff', 'Administrator') AND status = 'Active'",
      )
      .all();
    return rows.map((r) => r.id);
  }

  static updateProfile(id: string, input: UpdateProfileInput): User | null {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

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
    if (input.province !== undefined) {
      fields.push('province = ?');
      values.push(input.province);
    }
    if (input.age !== undefined) {
      fields.push('age = ?');
      values.push(input.age);
    }
    if (input.birth_date !== undefined) {
      fields.push('birth_date = ?');
      values.push(input.birth_date);
    }
    if (input.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(input.avatar_url);
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
      RETURNING ${USER_PUBLIC_COLUMNS}
    `);

    return (stmt.get(...values) as User) || null;
  }

  static updateStatus(id: string, status: string): User | null {
    const stmt = db.prepare(`
      UPDATE users
      SET status = ?, updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING ${USER_PUBLIC_COLUMNS}
    `);
    return (stmt.get(status, id) as User) || null;
  }

  static updateRole(id: string, role: string): User | null {
    const stmt = db.prepare(`
      UPDATE users
      SET role = ?, updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING ${USER_PUBLIC_COLUMNS}
    `);
    return (stmt.get(role, id) as User) || null;
  }
}
