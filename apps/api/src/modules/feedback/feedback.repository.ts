import db from '../../db/client.js';
import type { Feedback, CreateFeedbackInput, ModerateFeedbackInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface FeedbackWithDetails extends Feedback {
  tool_name: string;
  reviewer_name: string;
  reviewer_barangay: string;
}

export class FeedbackRepository {
  static findById(id: string): FeedbackWithDetails | null {
    const stmt = db.prepare(`
      SELECT
        f.*,
        t.name as tool_name,
        u.full_name as reviewer_name,
        u.barangay as reviewer_barangay
      FROM feedback f
      JOIN tools t ON f.tool_id = t.id
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `);
    const row = stmt.get(id);
    return (row as FeedbackWithDetails) || null;
  }

  static findPublic(toolId?: string): FeedbackWithDetails[] {
    let sql = `
      SELECT
        f.*,
        t.name as tool_name,
        u.full_name as reviewer_name,
        u.barangay as reviewer_barangay
      FROM feedback f
      JOIN tools t ON f.tool_id = t.id
      JOIN users u ON f.user_id = u.id
      WHERE f.is_public = 1
    `;
    const params: string[] = [];

    if (toolId) {
      sql += ' AND f.tool_id = ?';
      params.push(toolId);
    }

    sql += ' ORDER BY datetime(f.created_at) DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as FeedbackWithDetails[];
  }

  static findAll(): FeedbackWithDetails[] {
    const stmt = db.prepare(`
      SELECT
        f.*,
        t.name as tool_name,
        u.full_name as reviewer_name,
        u.barangay as reviewer_barangay
      FROM feedback f
      JOIN tools t ON f.tool_id = t.id
      JOIN users u ON f.user_id = u.id
      ORDER BY datetime(f.created_at) DESC
    `);
    return stmt.all() as FeedbackWithDetails[];
  }

  static create(userId: string, input: CreateFeedbackInput): Feedback {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO feedback (
        id, user_id, tool_id, rental_id, overall_rating,
        tool_condition_rating, service_rating, comments, is_public
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      RETURNING *
    `);

    return stmt.get(
      id,
      userId,
      input.tool_id,
      input.rental_id ?? null,
      input.overall_rating,
      input.tool_condition_rating,
      input.service_rating,
      input.comments,
    ) as Feedback;
  }

  static moderate(id: string, input: ModerateFeedbackInput): Feedback | null {
    const stmt = db.prepare(`
      UPDATE feedback
      SET is_public = ?
      WHERE id = ?
      RETURNING *
    `);
    return (stmt.get(input.is_public ? 1 : 0, id) as Feedback) || null;
  }
}

