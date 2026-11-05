import type { Request, Response, NextFunction } from 'express';
import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackSchema, ModerateFeedbackSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';

export class FeedbackController {
  static listPublic(req: Request, res: Response, next: NextFunction): void {
    try {
      const toolId = req.query.tool_id as string | undefined;
      const reviews = FeedbackService.getPublicReviews(toolId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  static listAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const reviews = FeedbackService.getAllReviews();
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  static create(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = CreateFeedbackSchema.parse(req.body);
      const feedback = FeedbackService.submitFeedback(
        req.user.id,
        req.user.full_name,
        validated,
      );
      res.status(201).json(feedback);
    } catch (error) {
      next(error);
    }
  }

  static moderate(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('Feedback ID is required');

      const validated = ModerateFeedbackSchema.parse(req.body);
      const feedback = FeedbackService.moderateFeedback(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  }
}

