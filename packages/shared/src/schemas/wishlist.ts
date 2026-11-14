import { z } from 'zod';
import { ToolSchema } from './tool.js';

export const WishlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  created_at: z.string(),
  tool: ToolSchema.optional(),
});

export type Wishlist = z.infer<typeof WishlistSchema>;

export const AddToWishlistSchema = z.object({
  tool_id: z.string().uuid(),
});

export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;

