import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Admin-only listing of all municipal users
usersRouter.get('/', requireRole('Administrator'), UsersController.list);

// View user profile (self, or staff/admin)
usersRouter.get('/:id', UsersController.getById);

// Update profile
usersRouter.patch('/:id/profile', UsersController.updateProfile);

// Admin-only account status and role management
usersRouter.patch('/:id/status', requireRole('Administrator'), UsersController.updateStatus);
usersRouter.patch('/:id/role', requireRole('Administrator'), UsersController.updateRole);

