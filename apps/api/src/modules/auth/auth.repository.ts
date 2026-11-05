import db from '../../db/client.js';
import type { User, RegisterUserInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface UserWithPassword extends User {
  password_hash: string;
}

export class AuthRepository {
  static findByEmail(email: string): UserWithPassword | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
    const row = stmt.get(email);
    return (row as UserWithPassword) || null;
  }

  static findById(id: string): User | null {
    const stmt = db.prepare('SELECT id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at FROM users WHERE id = ?');
    const row = stmt.get(id);
    return (row as User) || null;
  }

  static createBorrower(input: RegisterUserInput, passwordHash: string): User {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO users (
        id, full_name, email, password_hash, phone, birth_date, barangay, address, role, status, failed_login_attempts
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Borrower', 'Active', 0)
      RETURNING id, full_name, email, phone, birth_date, barangay, address, role, status, failed_login_attempts, lockout_until, created_at, updated_at
    `);

    return stmt.get(
      id,
      input.full_name,
      input.email.toLowerCase(),
      passwordHash,
      input.phone,
      input.birth_date,
      input.barangay,
      input.address,
    ) as User;
  }

  static incrementFailedAttempts(userId: string, currentAttempts: number, lockoutMinutes = 15): void {
    const newAttempts = currentAttempts + 1;
    let lockoutUntil: string | null = null;

    // Lockout after 5 failed attempts
    if (newAttempts >= 5) {
      lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
    }

    db.prepare(`
      UPDATE users
      SET failed_login_attempts = ?, lockout_until = ?, updated_at = DATETIME('now')
      WHERE id = ?
    `).run(newAttempts, lockoutUntil, userId);
  }

  static resetFailedAttempts(userId: string): void {
    db.prepare(`
      UPDATE users
      SET failed_login_attempts = 0, lockout_until = NULL, updated_at = DATETIME('now')
      WHERE id = ?
    `).run(userId);
  }
}

