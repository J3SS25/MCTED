import type { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { UpdateProfileSchema, UpdateUserStatusSchema, UpdateUserRoleSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';
import { saveUploadFile } from '../../utils/fileStorage.js';

export class UsersController {
  static list(req: Request, res: Response, next: NextFunction): void {
    try {
      const users = UsersService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('User ID is required');

      // IDOR check: borrowers can only view their own user details, staff/admin can view any
      if (req.user?.role === 'Borrower' && req.user.id !== id) {
        throw AppError.forbidden('You can only view your own account information');
      }

      const user = UsersService.getUserById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static updateProfile(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('User ID is required');

      // IDOR check: borrowers and staff can only update their own profile; admins can update any
      if (req.user?.role !== 'Administrator' && req.user?.id !== id) {
        throw AppError.forbidden('You can only update your own profile');
      }

      const validated = UpdateProfileSchema.parse(req.body);
      const user = UsersService.updateProfile(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('User ID is required');

      const validated = UpdateUserStatusSchema.parse(req.body);
      const user = UsersService.updateUserStatus(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static updateRole(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params['id'] as string;
      if (!id) throw AppError.badRequest('User ID is required');

      const validated = UpdateUserRoleSchema.parse(req.body);
      const user = UsersService.updateUserRole(id, validated, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static uploadAvatar(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = (req.params['id'] as string) || req.user.id;

      if (req.user.role !== 'Administrator' && req.user.role !== 'Admin' && req.user.id !== id) {
        throw AppError.forbidden('You can only update your own profile picture');
      }

      const avatarData = req.body.avatar_url || req.body.profile_picture_url || req.body.image;
      if (!avatarData) {
        throw AppError.badRequest('Avatar image data is required');
      }

      const savedUrl = saveUploadFile(avatarData, 'avatars');
      const user = UsersService.updateAvatar(id, savedUrl, {
        id: req.user.id,
        name: req.user.full_name,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

