import { MaintenanceRepository, type MaintenanceWithDetails } from './maintenance.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/errors.js';
import type { CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceStatus } from '@mcteb/shared';
import db from '../../db/client.js';

export class MaintenanceService {
  static getById(id: string): MaintenanceWithDetails {
    const item = MaintenanceRepository.findById(id);
    if (!item) {
      throw AppError.notFound('Maintenance record not found');
    }
    return item;
  }

  static getAll(status?: MaintenanceStatus): MaintenanceWithDetails[] {
    return MaintenanceRepository.findAll(status);
  }

  static createReport(
    reporterId: string,
    reporterName: string,
    input: CreateMaintenanceInput,
  ): MaintenanceWithDetails {
    const tool = ToolsRepository.findById(input.tool_id);
    if (!tool) {
      throw AppError.notFound('Tool not found');
    }

    const tx = db.transaction(() => {
      const record = MaintenanceRepository.create(reporterId, input);

      // If issue is severe or critical, mark tool as under maintenance so it cannot be booked
      if (input.severity === 'Severe' || input.severity === 'Critical') {
        ToolsRepository.update(input.tool_id, {
          availability_status: 'Maintenance',
          condition_status: 'Needs Repair',
        });
      }

      AuditService.record({
        actor_id: reporterId,
        actor_name: reporterName,
        action: 'MAINTENANCE_REPORTED',
        target_type: 'maintenance',
        target_id: record.id,
        details: `Reported ${input.severity} severity issue for "${tool.name}": ${input.issue_description}`,
      });

      return record;
    });

    const res = tx();
    return this.getById(res.id);
  }

  static updateRecord(
    id: string,
    input: UpdateMaintenanceInput,
    actor: { id: string; name: string },
  ): MaintenanceWithDetails {
    const existing = this.getById(id);

    const tx = db.transaction(() => {
      const updated = MaintenanceRepository.update(id, input);
      if (!updated) {
        throw AppError.internal('Failed to update maintenance record');
      }

      // If returning to service after repairs
      if (input.return_to_service && input.status === 'Completed') {
        ToolsRepository.update(existing.tool_id, {
          availability_status: 'Available',
          condition_status: 'Good',
        });

        AuditService.record({
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'TOOL_RETURNED_TO_SERVICE',
          target_type: 'tool',
          target_id: existing.tool_id,
          details: `Repairs completed. Restored "${existing.tool_name}" to Available status`,
        });
      }

      AuditService.record({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'MAINTENANCE_UPDATED',
        target_type: 'maintenance',
        target_id: id,
        details: `Updated maintenance ticket for "${existing.tool_name}". Status: ${input.status || existing.status}`,
      });

      return updated;
    });

    tx();
    return this.getById(id);
  }
}

