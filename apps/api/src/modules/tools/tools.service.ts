import { ToolsRepository } from './tools.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/errors.js';
import type { Tool, CreateToolInput, UpdateToolInput, ToolFilterInput } from '@mcteb/shared';

export class ToolsService {
  static getTools(filters: ToolFilterInput): { items: Tool[]; total: number } {
    return ToolsRepository.findMany(filters);
  }

  static getToolById(id: string): Tool {
    const tool = ToolsRepository.findById(id);
    if (!tool) {
      throw AppError.notFound('Tool not found');
    }
    return tool;
  }

  static createTool(input: CreateToolInput, actor: { id: string; name: string }): Tool {
    const tool = ToolsRepository.create(input);

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TOOL_CREATED',
      target_type: 'tool',
      target_id: tool.id,
      details: `Added new item "${tool.name}" (${tool.category}) with initial stock of ${tool.total_quantity}`,
    });

    return tool;
  }

  static updateTool(id: string, input: UpdateToolInput, actor: { id: string; name: string }): Tool {
    const current = this.getToolById(id);

    // If total quantity is being reduced below borrowed quantity
    if (input.total_quantity !== undefined) {
      const currentlyLoaned = current.total_quantity - current.available_quantity;
      if (input.total_quantity < currentlyLoaned) {
        throw AppError.badRequest(
          `Cannot reduce total quantity to ${input.total_quantity} because ${currentlyLoaned} items are currently on loan`,
        );
      }
    }

    const updated = ToolsRepository.update(id, input);
    if (!updated) {
      throw AppError.notFound('Tool not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TOOL_UPDATED',
      target_type: 'tool',
      target_id: id,
      details: `Updated item details for "${updated.name}"`,
    });

    return updated;
  }

  static archiveTool(id: string, actor: { id: string; name: string }): Tool {
    const tool = this.getToolById(id);

    if (tool.available_quantity < tool.total_quantity) {
      throw AppError.badRequest('Cannot archive tool while units are currently borrowed or reserved');
    }

    const updated = ToolsRepository.update(id, { availability_status: 'Archived' });
    if (!updated) {
      throw AppError.notFound('Tool not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TOOL_ARCHIVED',
      target_type: 'tool',
      target_id: id,
      details: `Archived catalog item "${tool.name}"`,
    });

    return updated;
  }
}

