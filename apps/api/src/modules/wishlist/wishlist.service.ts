import { WishlistRepository, type WishlistItemWithTool } from './wishlist.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { AppError } from '../../utils/errors.js';

export class WishlistService {
  static getWishlist(userId: string): WishlistItemWithTool[] {
    return WishlistRepository.findByUserId(userId);
  }

  static addToWishlist(userId: string, toolId: string): WishlistItemWithTool {
    const tool = ToolsRepository.findById(toolId);
    if (!tool) {
      throw AppError.notFound('Tool not found');
    }
    return WishlistRepository.add(userId, toolId);
  }

  static removeFromWishlist(userId: string, toolId: string): void {
    const removed = WishlistRepository.remove(userId, toolId);
    if (!removed) {
      throw AppError.notFound('Item not in wishlist');
    }
  }
}

