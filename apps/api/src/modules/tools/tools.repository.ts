import db from '../../db/client.js';
import type { Tool, CreateToolInput, UpdateToolInput, ToolFilterInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export class ToolsRepository {
  static findById(id: string): Tool | null {
    const stmt = db.prepare('SELECT * FROM tools WHERE id = ?');
    const row = stmt.get(id);
    return (row as Tool) || null;
  }

  static findMany(filters: ToolFilterInput): { items: Tool[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }
    if (filters.availability) {
      conditions.push('availability_status = ?');
      params.push(filters.availability);
    }
    if (filters.condition) {
      conditions.push('condition_status = ?');
      params.push(filters.condition);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM tools ${whereClause}`);
    const totalRow = countStmt.get(...params) as { count: number };
    const total = totalRow ? totalRow.count : 0;

    const offset = (filters.page - 1) * filters.limit;
    const queryStmt = db.prepare(`
      SELECT * FROM tools
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `);

    const items = queryStmt.all(...params, filters.limit, offset) as Tool[];

    return { items, total };
  }

  static create(input: CreateToolInput): Tool {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO tools (
        id, name, category, description, specifications, availability_status, condition_status,
        rental_fee_centavos, deposit_fee_centavos, total_quantity, available_quantity, serial_number, image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      input.name,
      input.category,
      input.description,
      input.specifications ?? null,
      input.availability_status,
      input.condition_status,
      input.rental_fee_centavos,
      input.deposit_fee_centavos,
      input.total_quantity,
      input.total_quantity, // Initially all are available
      input.serial_number ?? null,
      input.image_url ?? null,
    ) as Tool;
  }

  static update(id: string, input: UpdateToolInput): Tool | null {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedKeys: (keyof UpdateToolInput)[] = [
      'name',
      'category',
      'description',
      'specifications',
      'availability_status',
      'condition_status',
      'rental_fee_centavos',
      'deposit_fee_centavos',
      'total_quantity',
      'available_quantity',
      'serial_number',
      'image_url',
    ];

    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((input[key] as string | number | null) ?? null);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = DATETIME('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tools
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(...values) as Tool) || null;
  }

  static adjustAvailableQuantity(id: string, delta: number): Tool | null {
    const stmt = db.prepare(`
      UPDATE tools
      SET
        available_quantity = MAX(0, available_quantity + ?),
        availability_status = CASE
          WHEN (available_quantity + ?) <= 0 THEN 'Borrowed'
          ELSE 'Available'
        END,
        updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(delta, delta, id) as Tool) || null;
  }
}

