import db from '../../db/client.js';
import type { Notification, CreateNotificationInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export class NotificationsRepository {
  static create(input: CreateNotificationInput): Notification {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      input.user_id,
      input.title,
      input.message,
      input.type,
      input.link_url ?? null,
    ) as Notification;
  }

  static findByUserId(userId: string): Notification[] {
    const stmt = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
    `);
    return stmt.all(userId) as Notification[];
  }

  static markAsRead(id: string, userId: string): boolean {
    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static markAllAsRead(userId: string): number {
    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `);
    const result = stmt.run(userId);
    return Number(result.changes);
  }
}

