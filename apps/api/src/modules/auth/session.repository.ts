import db from '../../db/client.js';

export interface SessionRecord {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

// Ensure session table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

export class SessionRepository {
  static create(token: string, userId: string, ttlDays = 7): SessionRecord {
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
      RETURNING *
    `);
    return stmt.get(token, userId, expiresAt) as SessionRecord;
  }

  static findValid(token: string): SessionRecord | null {
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE token = ? AND datetime(expires_at) > datetime('now')
    `);
    const row = stmt.get(token);
    return (row as SessionRecord) || null;
  }

  static delete(token: string): void {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  static deleteForUser(userId: string): void {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }
}

