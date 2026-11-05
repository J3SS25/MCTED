import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { SessionRepository } from '../modules/auth/session.repository.js';
import db from '../db/client.js';
import type { UserRole, UserStatus } from '@mcteb/shared';
import { hasPermission, type PermissionAction } from '@mcteb/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  barangay: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

export function extractAuthToken(req: Request): string | null {
  // Check cookie first
  if (req.cookies && req.cookies.mcteb_session) {
    return req.cookies.mcteb_session as string;
  }
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAuthToken(req);
  if (!token) {
    return next();
  }

  const session = SessionRepository.findValid(token);
  if (!session) {
    return next();
  }

  const userRow = db.prepare(`
    SELECT id, email, full_name, role, status, barangay, lockout_until
    FROM users
    WHERE id = ?
  `).get(session.user_id) as (AuthenticatedUser & { lockout_until: string | null }) | undefined;

  if (!userRow) {
    SessionRepository.delete(token);
    return next();
  }

  // Check lockout
  if (userRow.lockout_until && new Date(userRow.lockout_until) > new Date()) {
    return next(AppError.forbidden('Account is temporarily locked out due to failed attempts'));
  }

  // Check status
  if (userRow.status === 'Suspended') {
    return next(AppError.forbidden('Your account has been suspended by the administrator'));
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    full_name: userRow.full_name,
    role: userRow.role,
    status: userRow.status,
    barangay: userRow.barangay,
  };
  req.sessionToken = token;

  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required to access this resource'));
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

export function requirePermission(action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user ? req.user.role : 'Guest';
    if (!hasPermission(role, action)) {
      return next(
        req.user
          ? AppError.forbidden(`Insufficient permissions for ${action}`)
          : AppError.unauthorized(`Please log in to access this resource`),
      );
    }
    next();
  };
}

