import { Router } from 'express';
import { FeedbackController } from './feedback.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const feedbackRouter = Router();

// Public feedback list
feedbackRouter.get('/public', FeedbackController.listPublic);

// Authenticated borrower feedback submission
feedbackRouter.post('/', requireAuth, FeedbackController.create);

// Staff and Admin moderation
feedbackRouter.get('/all', requireAuth, requireRole('Municipal Staff', 'Administrator'), FeedbackController.listAll);
feedbackRouter.patch('/:id/moderate', requireAuth, requireRole('Municipal Staff', 'Administrator'), FeedbackController.moderate);

