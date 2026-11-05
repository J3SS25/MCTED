import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterUserSchema, LoginSchema } from '@mcteb/shared';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterUserSchema.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const { user, token } = await AuthService.register(validated, ip);

      res.cookie('mcteb_session', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginSchema.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const { user, token } = await AuthService.login(validated, ip);

      res.cookie('mcteb_session', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  static logout(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = req.sessionToken || (req.cookies && req.cookies.mcteb_session);
      if (token) {
        AuthService.logout(token);
      }
      res.clearCookie('mcteb_session');
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static me(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Not authenticated');
      }
      const user = AuthService.getCurrentUser(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

