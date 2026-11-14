import { Router } from 'express';
import { WishlistController } from './wishlist.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get('/', WishlistController.list);
wishlistRouter.post('/', WishlistController.add);
wishlistRouter.delete('/:toolId', WishlistController.remove);

