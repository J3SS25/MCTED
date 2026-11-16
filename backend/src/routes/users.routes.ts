import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const usersRouter: Router = Router();

// Administrator user management
usersRouter.get('/', requireAuth, requireRole('Administrator'), UsersController.list);

// Profile view and modification (self or Administrator)
usersRouter.get('/:id', requireAuth, UsersController.getById);
usersRouter.patch('/:id/profile', requireAuth, UsersController.updateProfile);

// Administrator-only role and status modifications
usersRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('Administrator'),
  UsersController.updateStatus,
);
usersRouter.patch(
  '/:id/role',
  requireAuth,
  requireRole('Administrator'),
  UsersController.updateRole,
);
