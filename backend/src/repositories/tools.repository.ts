import db from '../../db/client.js';
import type { Tool, CreateToolInput, UpdateToolInput, ToolFilterInput } from '@mcteb/shared';
import { MAX_TOOL_IMAGES } from '@mcteb/shared';
import { generateUUID } from '../utils/crypto.js';

const TOOL_SELECT_COLUMNS = `
  tools.*,
  u.full_name as owner_name,
  u.role as owner_role,
  u.email as owner_email,
  u.barangay as owner_barangay,
  u.phone as owner_phone
`;

function normalizeImageUrls(imageUrls?: string[], singleImageUrl?: string | null): string[] {
  if (Array.isArray(imageUrls)) {
    return imageUrls
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_TOOL_IMAGES);
  }
  if (typeof singleImageUrl === 'string' && singleImageUrl.trim()) {
    return [singleImageUrl.trim()];
  }
  return [];
}

function mapToolRow(row: Record<string, unknown> | undefined): Tool | null {
  if (!row) return null;

  let parsedImages: string[] = [];
  if (typeof row.images_json === 'string' && row.images_json.trim()) {
    try {
      const parsed = JSON.parse(row.images_json) as unknown;
      if (Array.isArray(parsed)) {
        parsedImages = parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, MAX_TOOL_IMAGES);
      }
    } catch {
      parsedImages = [];
    }
  }

  const singleUrl = typeof row.image_url === 'string' && row.image_url.trim() ? row.image_url : null;
  if (parsedImages.length === 0 && singleUrl) {
    parsedImages = [singleUrl];
  }

  const { images_json: _imagesJson, ...rest } = row;
  return {
    ...rest,
    image_url: parsedImages[0] ?? singleUrl,
    image_urls: parsedImages,
  } as Tool;
}

export class ToolsRepository {
  static findById(id: string): Tool | null {
    const stmt = db.prepare(`
      SELECT ${TOOL_SELECT_COLUMNS}
      FROM tools
      LEFT JOIN users u ON tools.owner_id = u.id
      WHERE tools.id = ?
    `);
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return mapToolRow(row);
  }

  static findBySerialNumber(serialNumber: string, excludeToolId?: string): Tool | null {
    const trimmed = serialNumber.trim();
    if (!trimmed) return null;

    if (excludeToolId) {
      const stmt = db.prepare(`
        SELECT ${TOOL_SELECT_COLUMNS}
        FROM tools
        LEFT JOIN users u ON tools.owner_id = u.id
        WHERE tools.serial_number IS NOT NULL
          AND TRIM(tools.serial_number) != ''
          AND LOWER(TRIM(tools.serial_number)) = LOWER(?)
          AND tools.id != ?
        LIMIT 1
      `);
      const row = stmt.get(trimmed, excludeToolId) as Record<string, unknown> | undefined;
      return mapToolRow(row);
    }

    const stmt = db.prepare(`
      SELECT ${TOOL_SELECT_COLUMNS}
      FROM tools
      LEFT JOIN users u ON tools.owner_id = u.id
      WHERE tools.serial_number IS NOT NULL
        AND TRIM(tools.serial_number) != ''
        AND LOWER(TRIM(tools.serial_number)) = LOWER(?)
      LIMIT 1
    `);
    const row = stmt.get(trimmed) as Record<string, unknown> | undefined;
    return mapToolRow(row);
  }

  static findMany(filters: ToolFilterInput): { items: Tool[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push(
        '(tools.name LIKE ? OR tools.description LIKE ? OR tools.category LIKE ? OR tools.serial_number LIKE ?)',
      );
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
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

    const rawItems = queryStmt.all(...params, filters.limit, offset) as Record<string, unknown>[];
    const items = rawItems
      .map((row) => mapToolRow(row))
      .filter((item): item is Tool => item !== null);

    return { items, total };
  }

  static create(input: CreateToolInput, ownerId?: string): Tool {
    const id = generateUUID();
    const imageUrls = normalizeImageUrls(input.image_urls, input.image_url);
    const primaryImageUrl = imageUrls[0] ?? null;
    const imagesJson = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;
    const serialNumber = input.serial_number?.trim() ? input.serial_number.trim() : null;

    const stmt = db.prepare(`
      INSERT INTO tools (
        id, name, category, description, specifications, availability_status, condition_status,
        total_quantity, available_quantity, serial_number,
        image_url, images_json, owner_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.category,
      input.description,
      input.specifications ?? null,
      input.availability_status,
      input.condition_status,
      input.total_quantity,
      input.total_quantity, // Initially all are available
      serialNumber,
      primaryImageUrl,
      imagesJson,
      ownerId ?? null,
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
      'total_quantity',
      'available_quantity',
      'serial_number',
    ];

    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        if (key === 'serial_number') {
          const trimmed = typeof input.serial_number === 'string' ? input.serial_number.trim() : '';
          fields.push('serial_number = ?');
          values.push(trimmed || null);
        } else {
          fields.push(`${key} = ?`);
          values.push((input[key] as string | number | null | undefined) ?? null);
        }
      }
    }

    if (input.image_urls !== undefined) {
      const normalized = normalizeImageUrls(input.image_urls, input.image_url);
      fields.push('image_url = ?');
      values.push(normalized[0] ?? null);
      fields.push('images_json = ?');
      values.push(normalized.length > 0 ? JSON.stringify(normalized) : null);
    } else if (input.image_url !== undefined) {
      const primary = input.image_url?.trim() || null;
      fields.push('image_url = ?');
      values.push(primary);
      fields.push('images_json = ?');
      values.push(primary ? JSON.stringify([primary]) : null);
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
      .prepare<{
        count: number;
      }>("SELECT COUNT(*) as count FROM rentals WHERE tool_id = ? AND status = 'Borrowed'")
      .get(toolId);
    return (row?.count ?? 0) > 0;
  }

  static delete(id: string): boolean {
    return db.atomic(() => {
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
    `);

    const info = stmt.run(delta, delta, id);
    if (Number(info.changes) === 0) return null;
    return this.findById(id);
  }
}
