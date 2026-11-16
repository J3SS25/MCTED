import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const feedbackRouter: Router = Router();

// Public feedback list for transparency
feedbackRouter.get('/public', FeedbackController.listPublic);

// Authenticated staff review list
feedbackRouter.get(
  '/all',
  requireAuth,
  requireRole('Administrator', 'Municipal Staff'),
  FeedbackController.listAll,
);

// Submit feedback (Borrowers)
feedbackRouter.post('/', requireAuth, FeedbackController.create);

// Moderate feedback (Admin only)
feedbackRouter.patch(
  '/:id/moderate',
  requireAuth,
  requireRole('Administrator'),
  FeedbackController.moderate,
);
