import db from '../../db/client.js';
import type { Tool, CreateToolInput, UpdateToolInput, ToolFilterInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

const TOOL_SELECT_COLUMNS = `
  tools.*,
  u.full_name as owner_name,
  u.role as owner_role
`;

export class ToolsRepository {
  static findById(id: string): Tool | null {
    const stmt = db.prepare(`
      SELECT ${TOOL_SELECT_COLUMNS}
      FROM tools
      LEFT JOIN users u ON tools.owner_id = u.id
      WHERE tools.id = ?
    `);
    const row = stmt.get(id);
    return (row as Tool) || null;
  }

  static findMany(filters: ToolFilterInput): { items: Tool[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('(tools.name LIKE ? OR tools.description LIKE ? OR tools.category LIKE ?)');
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (filters.category) {
      if (filters.category === 'Agriculture') {
        conditions.push("tools.category IN ('Agriculture', 'Agricultural')");
      } else if (filters.category === 'Fishing') {
        conditions.push("tools.category IN ('Fishing', 'Fishery')");
      } else {
        conditions.push('tools.category = ?');
        params.push(filters.category);
      }
    }
    if (filters.availability) {
      conditions.push('tools.availability_status = ?');
      params.push(filters.availability);
    }
    if (filters.condition) {
      conditions.push('tools.condition_status = ?');
      params.push(filters.condition);
    }
    if (filters.owner_id) {
      conditions.push('tools.owner_id = ?');
      params.push(filters.owner_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY tools.name ASC';
    switch (filters.sort_by) {
      case 'name_desc':
        orderClause = 'ORDER BY tools.name DESC';
        break;
      case 'price_asc':
        orderClause = 'ORDER BY tools.rental_fee_centavos ASC, tools.name ASC';
        break;
      case 'price_desc':
        orderClause = 'ORDER BY tools.rental_fee_centavos DESC, tools.name ASC';
        break;
      case 'newest':
        orderClause = 'ORDER BY datetime(tools.created_at) DESC, tools.name ASC';
        break;
      case 'availability':
        orderClause =
          "ORDER BY CASE tools.availability_status WHEN 'Available' THEN 0 WHEN 'Reserved' THEN 1 WHEN 'Borrowed' THEN 2 WHEN 'Maintenance' THEN 3 ELSE 4 END, tools.name ASC";
        break;
      case 'name_asc':
      default:
        orderClause = 'ORDER BY tools.name ASC';
        break;
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM tools ${whereClause}`);
    const totalRow = countStmt.get(...params) as { count: number };
    const total = totalRow ? totalRow.count : 0;

    const offset = (filters.page - 1) * filters.limit;
    const queryStmt = db.prepare(`
      SELECT ${TOOL_SELECT_COLUMNS}
      FROM tools
      LEFT JOIN users u ON tools.owner_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `);

    const items = queryStmt.all(...params, filters.limit, offset) as Tool[];

    return { items, total };
  }

  static create(input: CreateToolInput, ownerId?: string): Tool {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO tools (
        id, name, category, description, specifications, availability_status, condition_status,
        rental_fee_centavos, deposit_fee_centavos, total_quantity, available_quantity, serial_number, image_url,
        owner_id, discount_percent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      ownerId ?? null,
      input.discount_percent ?? 0,
    );

    return this.findById(id)!;
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
      'discount_percent',
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
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static hasActiveBorrowedRentals(toolId: string): boolean {
    const row = db
      .prepare<{ count: number }>(
        "SELECT COUNT(*) as count FROM rentals WHERE tool_id = ? AND status = 'Borrowed'",
      )
      .get(toolId);
    return (row?.count ?? 0) > 0;
  }

  static delete(id: string): boolean {
    return db.transaction(() => {
      db.prepare('UPDATE payments SET tool_id = NULL WHERE tool_id = ?').run(id);
      db.prepare('DELETE FROM feedback WHERE tool_id = ?').run(id);
      db.prepare('DELETE FROM maintenance WHERE tool_id = ?').run(id);
      db.prepare('DELETE FROM rentals WHERE tool_id = ?').run(id);
      db.prepare('DELETE FROM reservations WHERE tool_id = ?').run(id);
      const res = db.prepare('DELETE FROM tools WHERE id = ?').run(id);
      return Number(res.changes) > 0;
    })();
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

