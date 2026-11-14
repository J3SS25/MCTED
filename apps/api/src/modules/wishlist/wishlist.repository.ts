import db from '../../db/client.js';
import { generateUUID } from '../../utils/crypto.js';
import type { Wishlist, Tool } from '@mcteb/shared';

export interface WishlistItemWithTool extends Wishlist {
  tool: Tool;
}

export class WishlistRepository {
  static findByUserId(userId: string): WishlistItemWithTool[] {
    const stmt = db.prepare(`
      SELECT 
        w.id,
        w.user_id,
        w.tool_id,
        w.created_at,
        t.id as t_id,
        t.name as t_name,
        t.category as t_category,
        t.description as t_description,
        t.specifications as t_specifications,
        t.availability_status as t_availability_status,
        t.condition_status as t_condition_status,
        t.rental_fee_centavos as t_rental_fee_centavos,
        t.deposit_fee_centavos as t_deposit_fee_centavos,
        t.discount_percentage as t_discount_percentage,
        t.total_quantity as t_total_quantity,
        t.available_quantity as t_available_quantity,
        t.serial_number as t_serial_number,
        t.image_url as t_image_url,
        t.created_at as t_created_at,
        t.updated_at as t_updated_at,
        t.user_id as t_user_id
      FROM wishlists w
      JOIN tools t ON w.tool_id = t.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `);

    const rows = stmt.all(userId) as any[];

    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      tool_id: r.tool_id,
      created_at: r.created_at,
      tool: {
        id: r.t_id,
        name: r.t_name,
        category: r.t_category,
        description: r.t_description,
        specifications: r.t_specifications,
        availability_status: r.t_availability_status,
        condition_status: r.t_condition_status,
        rental_fee_centavos: r.t_rental_fee_centavos,
        deposit_fee_centavos: r.t_deposit_fee_centavos,
        discount_percentage: r.t_discount_percentage ?? 0,
        total_quantity: r.t_total_quantity,
        available_quantity: r.t_available_quantity,
        serial_number: r.t_serial_number,
        image_url: r.t_image_url,
        created_at: r.t_created_at,
        updated_at: r.t_updated_at,
        user_id: r.t_user_id,
      },
    }));
  }

  static add(userId: string, toolId: string): WishlistItemWithTool {
    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND tool_id = ?').get(userId, toolId);
    if (!existing) {
      const id = generateUUID();
      db.prepare(`
        INSERT INTO wishlists (id, user_id, tool_id)
        VALUES (?, ?, ?)
      `).run(id, userId, toolId);
    }
    const all = this.findByUserId(userId);
    return all.find((item) => item.tool_id === toolId)!;
  }

  static remove(userId: string, toolId: string): boolean {
    const res = db.prepare('DELETE FROM wishlists WHERE user_id = ? AND tool_id = ?').run(userId, toolId);
    return (res.changes as number) > 0;
  }
}

