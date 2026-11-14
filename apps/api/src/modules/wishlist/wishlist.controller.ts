import type { Request, Response, NextFunction } from 'express';
import { WishlistService } from './wishlist.service.js';
import { AppError } from '../../utils/errors.js';
import { AddToWishlistSchema } from '@mcteb/shared';

export class WishlistController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const items = WishlistService.getWishlist(req.user.id);
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  static add(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { tool_id } = AddToWishlistSchema.parse(req.body);
      const item = WishlistService.addToWishlist(req.user.id, tool_id);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  static remove(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const toolId = req.params['toolId'] as string;
      if (!toolId) throw AppError.badRequest('Tool ID is required');

      WishlistService.removeFromWishlist(req.user.id, toolId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

