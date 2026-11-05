import { UsersRepository } from './users.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AppError } from '../../utils/errors.js';
import type { User, UpdateProfileInput, UpdateUserStatusInput, UpdateUserRoleInput } from '@mcteb/shared';

export class UsersService {
  static getAllUsers(): User[] {
    return UsersRepository.findAll();
  }

  static getUserById(id: string): User {
    const user = UsersRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  static updateProfile(id: string, input: UpdateProfileInput, actor: { id: string; name: string }): User {
    const updated = UsersRepository.updateProfile(id, input);
    if (!updated) {
      throw AppError.notFound('User not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'USER_PROFILE_UPDATED',
      target_type: 'user',
      target_id: id,
      details: 'Updated profile contact/address details',
    });

    return updated;
  }

  static updateUserStatus(id: string, input: UpdateUserStatusInput, actor: { id: string; name: string }): User {
    const targetUser = this.getUserById(id);

    // Safeguard 1: Prevent self-suspension
    if (actor.id === id && input.status === 'Suspended') {
      throw AppError.badRequest('Administrators cannot suspend their own account');
    }

    // Safeguard 2: If suspending an admin, ensure at least one other active admin remains
    if (targetUser.role === 'Administrator' && input.status === 'Suspended') {
      const activeAdmins = UsersRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw AppError.badRequest('Cannot suspend the sole remaining active Administrator');
      }
    }

    const updated = UsersRepository.updateStatus(id, input.status);
    if (!updated) {
      throw AppError.notFound('User not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'USER_STATUS_UPDATED',
      target_type: 'user',
      target_id: id,
      details: `Status changed from ${targetUser.status} to ${input.status}. Reason: ${input.reason}`,
    });

    NotificationsService.create({
      user_id: id,
      title: 'Account Status Update',
      message: `Your account status is now ${input.status}. Reason: ${input.reason}`,
      type: input.status === 'Active' ? 'success' : 'danger',
    });

    return updated;
  }

  static updateUserRole(id: string, input: UpdateUserRoleInput, actor: { id: string; name: string }): User {
    const targetUser = this.getUserById(id);

    // Safeguard: Demoting the last active administrator
    if (targetUser.role === 'Administrator' && input.role !== 'Administrator') {
      const activeAdmins = UsersRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw AppError.badRequest('Cannot demote the sole remaining active Administrator');
      }
    }

    const updated = UsersRepository.updateRole(id, input.role);
    if (!updated) {
      throw AppError.notFound('User not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'USER_ROLE_UPDATED',
      target_type: 'user',
      target_id: id,
      details: `Role changed from ${targetUser.role} to ${input.role}. Reason: ${input.reason}`,
    });

    NotificationsService.create({
      user_id: id,
      title: 'Account Role Update',
      message: `Your account role has been updated to ${input.role}. Reason: ${input.reason}`,
      type: 'info',
    });

    return updated;
  }
}

