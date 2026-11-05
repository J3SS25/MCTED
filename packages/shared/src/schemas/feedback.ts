import { z } from 'zod';

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  rental_id: z.string().uuid().nullable().optional(),
  overall_rating: z.number().int().min(1).max(5),
  tool_condition_rating: z.number().int().min(1).max(5),
  service_rating: z.number().int().min(1).max(5),
  comments: z.string().min(3).max(1000),
  is_public: z.number().int().min(0).max(1),
  created_at: z.string(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export const CreateFeedbackSchema = z.object({
  tool_id: z.string().uuid(),
  rental_id: z.string().uuid().optional(),
  overall_rating: z.number().int().min(1).max(5),
  tool_condition_rating: z.number().int().min(1).max(5),
  service_rating: z.number().int().min(1).max(5),
  comments: z.string().min(3).max(1000),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

export const ModerateFeedbackSchema = z.object({
  is_public: z.boolean(),
});

export type ModerateFeedbackInput = z.infer<typeof ModerateFeedbackSchema>;

