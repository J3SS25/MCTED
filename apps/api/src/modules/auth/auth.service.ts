import { AuthRepository } from './auth.repository.js';
import { SessionRepository } from './session.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../../utils/crypto.js';
import type { RegisterUserInput, LoginInput, User } from '@mcteb/shared';

export class AuthService {
  static async register(input: RegisterUserInput, ipAddress?: string): Promise<{ user: User; token: string }> {
    // 1. Check duplicate email
    const existing = AuthRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('An account with this email address already exists');
    }

    // 2. Validate municipal age policy (minimum 18 years old)
    const birthDate = new Date(input.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      throw AppError.badRequest('Borrowers must be at least 18 years old under Municipal policies');
    }

    // 3. Hash password
    const passwordHash = await hashPassword(input.password);

    // 4. Create borrower account
    const user = AuthRepository.createBorrower(input, passwordHash);

    // 5. Create session token
    const token = generateSessionToken();
    SessionRepository.create(token, user.id);

    // 6. Audit & Notification
    AuditService.record({
      actor_id: user.id,
      actor_name: user.full_name,
      action: 'USER_REGISTERED',
      target_type: 'user',
      target_id: user.id,
      details: `Registered as Borrower in barangay ${user.barangay}`,
      ip_address: ipAddress,
    });

    NotificationsService.create({
      user_id: user.id,
      title: 'Welcome to MCTEB',
      message: 'Mabuhay! Your municipal tool bank account has been created. You can now browse and reserve equipment.',
      type: 'success',
      link_url: '/catalog',
    });

    return { user, token };
  }

  static async login(input: LoginInput, ipAddress?: string): Promise<{ user: User; token: string }> {
    const userWithPassword = AuthRepository.findByEmail(input.email);

    // Defensive check: Do not reveal whether user exists
    if (!userWithPassword) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check account lockout
    if (userWithPassword.lockout_until) {
      const lockoutDate = new Date(userWithPassword.lockout_until);
      if (lockoutDate > new Date()) {
        const remainingMinutes = Math.ceil((lockoutDate.getTime() - Date.now()) / (1000 * 60));
        throw AppError.forbidden(
          `Account is temporarily locked due to failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        );
      }
    }

    // Verify password
    const isValid = await verifyPassword(input.password, userWithPassword.password_hash);
    if (!isValid) {
      AuthRepository.incrementFailedAttempts(userWithPassword.id, userWithPassword.failed_login_attempts);
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check if account suspended
    if (userWithPassword.status === 'Suspended') {
      throw AppError.forbidden('Your account has been suspended by the municipal administrator');
    }

    // Reset failed login attempts on successful authentication
    AuthRepository.resetFailedAttempts(userWithPassword.id);

    // Create session token
    const token = generateSessionToken();
    SessionRepository.create(token, userWithPassword.id);

    // Record login audit
    AuditService.record({
      actor_id: userWithPassword.id,
      actor_name: userWithPassword.full_name,
      action: 'USER_LOGIN',
      target_type: 'user',
      target_id: userWithPassword.id,
      details: 'Successful login',
      ip_address: ipAddress,
    });

    const { password_hash: _, ...safeUser } = userWithPassword;
    return { user: safeUser, token };
  }

  static logout(token: string): void {
    SessionRepository.delete(token);
  }

  static getCurrentUser(userId: string): User {
    const user = AuthRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }
}

