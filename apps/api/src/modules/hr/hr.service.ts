import { HrRepository } from './hr.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/errors.js';
import { hashPassword } from '../../utils/crypto.js';
import type { User } from '@mcteb/shared';

export class HrService {
  static getStaffList(): User[] {
    return HrRepository.listStaff();
  }

  static async onboardStaff(
    input: {
      full_name: string;
      email: string;
      phone: string;
      birth_date: string;
      province?: string;
      barangay: string;
      address: string;
      role: 'Municipal Staff' | 'Staff' | 'Administrator' | 'Admin';
      temporaryPassword?: string;
    },
    actor: { id: string; name: string },
  ): Promise<User> {
    const existing = AuthRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const password = input.temporaryPassword || 'BascoStaff@2026!';
    const passwordHash = await hashPassword(password);

    const user = HrRepository.createStaff({
      ...input,
      passwordHash,
    });

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'HR_STAFF_ONBOARDED',
      target_type: 'user',
      target_id: user.id,
      details: `Created new staff account "${user.full_name}" with role "${user.role}"`,
    });

    return user;
  }

  static updateStaffRole(id: string, role: string, actor: { id: string; name: string }): User {
    const updated = HrRepository.updateStaff(id, { role });
    if (!updated) {
      throw AppError.notFound('Staff member not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'HR_STAFF_ROLE_UPDATED',
      target_type: 'user',
      target_id: id,
      details: `Updated staff role to "${role}"`,
    });

    return updated;
  }

  static decommissionStaff(id: string, actor: { id: string; name: string }): User {
    if (actor.id === id) {
      throw AppError.badRequest('Administrators cannot decommission their own account');
    }

    const updated = HrRepository.updateStaff(id, { status: 'Suspended' });
    if (!updated) {
      throw AppError.notFound('Staff member not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'HR_STAFF_DECOMMISSIONED',
      target_type: 'user',
      target_id: id,
      details: 'Suspended/decommissioned staff account',
    });

    return updated;
  }
}

