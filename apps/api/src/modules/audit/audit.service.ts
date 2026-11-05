import { AuditRepository } from './audit.repository.js';
import type { CreateAuditLogInput, AuditLogFilterInput, AuditLog } from '@mcteb/shared';

export class AuditService {
  static record(input: CreateAuditLogInput): AuditLog {
    return AuditRepository.create(input);
  }

  static getLogs(filters: AuditLogFilterInput): { items: AuditLog[]; total: number } {
    return AuditRepository.findMany(filters);
  }
}

