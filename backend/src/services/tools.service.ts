import { ToolsRepository } from '../repositories/tools.repository.js';
import { AuditService } from './audit.service.js';
import { NotificationsService } from './notifications.service.js';
import { AppError } from '../utils/errors.js';
import {
  validateAndModerateImage,
  validateToolImagesBatch,
  type Tool,
  type CreateToolInput,
  type UpdateToolInput,
  type ToolFilterInput,
} from '@mcteb/shared';

interface ToolActor {
  id: string;
  name: string;
  role: string;
}

function assertStaffOrAdmin(actor: ToolActor): void {
  if (actor.role !== 'Municipal Staff' && actor.role !== 'Administrator') {
    throw AppError.forbidden(
      'Only Municipal Staff and Administrators can upload, update, archive, or delete tools and equipment.',
    );
  }
}

function validateToolImagesInput(input: {
  image_urls?: string[];
  image_url?: string;
  image_filenames?: string[];
}): void {
  if (input.image_urls !== undefined) {
    const batchCheck = validateToolImagesBatch(input.image_urls, input.image_filenames);
    if (!batchCheck.valid) {
      throw AppError.badRequest(
        batchCheck.reason || 'Uploaded images failed validation or content moderation.',
      );
    }
  } else if (input.image_url !== undefined && input.image_url.trim() !== '') {
    const singleCheck = validateAndModerateImage(input.image_url, input.image_filenames?.[0]);
    if (!singleCheck.valid) {
      throw AppError.badRequest(
        singleCheck.reason || 'Uploaded image failed validation or content moderation.',
      );
    }
  }
}

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

  static verifySerialNumber(
    serialNumber: string,
    excludeToolId?: string,
  ): { exists: boolean; valid: boolean; message: string } {
    const trimmed = (serialNumber || '').trim();
    if (!trimmed) {
      return {
        exists: false,
        valid: false,
        message: 'Serial ID Number is required.',
      };
    }

    const existing = ToolsRepository.findBySerialNumber(trimmed, excludeToolId);
    if (existing) {
      return {
        exists: true,
        valid: false,
        message: `Serial ID Number "${trimmed}" already exists in the database.`,
      };
    }

    return {
      exists: false,
      valid: true,
      message: 'Serial ID Number is unique and available.',
    };
  }

  static createTool(input: CreateToolInput, actor: ToolActor): Tool {
    assertStaffOrAdmin(actor);

    const serialTrimmed = input.serial_number?.trim();
    if (serialTrimmed) {
      const duplicate = ToolsRepository.findBySerialNumber(serialTrimmed);
      if (duplicate) {
        throw AppError.conflict(
          `Serial ID Number "${serialTrimmed}" already exists in the database. Please enter a unique Serial ID Number.`,
        );
      }
    }

    validateToolImagesInput(input);

    const tool = ToolsRepository.create(input, actor.id);

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TOOL_CREATED',
      target_type: 'tool',
      target_id: tool.id,
      details: `Added new item "${tool.name}" (${tool.category}) with initial stock of ${tool.total_quantity}`,
    });

    NotificationsService.create({
      user_id: actor.id,
      title: 'Inventory Update: Tool Added',
      message: `"${tool.name}" (${tool.category}) has been added to the catalog with ${tool.total_quantity} unit(s).`,
      type: 'success',
      link_url: `/catalog/${tool.id}`,
    });

    return tool;
  }

  static updateTool(id: string, input: UpdateToolInput, actor: ToolActor): Tool {
    assertStaffOrAdmin(actor);

    const current = this.getToolById(id);

    const serialTrimmed = input.serial_number?.trim();
    if (serialTrimmed) {
      const duplicate = ToolsRepository.findBySerialNumber(serialTrimmed, id);
      if (duplicate) {
        throw AppError.conflict(
          `Serial ID Number "${serialTrimmed}" already exists in the database. Please enter a unique Serial ID Number.`,
        );
      }
    }

    validateToolImagesInput(input);

    // If total quantity is being reduced below borrowed quantity
    if (input.total_quantity !== undefined) {
      const currentlyLoaned = current.total_quantity - current.available_quantity;
      if (input.total_quantity < currentlyLoaned) {
        throw AppError.badRequest(
          `Cannot reduce total quantity to ${input.total_quantity} because ${currentlyLoaned} items are currently on loan`,
        );
      }
      if (input.available_quantity === undefined) {
        input.available_quantity = Math.max(0, input.total_quantity - currentlyLoaned);
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

    NotificationsService.create({
      user_id: actor.id,
      title: 'Inventory Update: Tool Edited',
      message: `Details for "${updated.name}" have been updated (Status: ${updated.availability_status}).`,
      type: 'info',
      link_url: `/catalog/${updated.id}`,
    });

    return updated;
  }

  static archiveTool(id: string, actor: ToolActor): Tool {
    assertStaffOrAdmin(actor);

    const tool = this.getToolById(id);

    if (tool.available_quantity < tool.total_quantity) {
      throw AppError.badRequest(
        'Cannot archive tool while units are currently borrowed or reserved',
      );
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

    NotificationsService.create({
      user_id: actor.id,
      title: 'Inventory Update: Tool Archived',
      message: `"${tool.name}" has been marked as Archived.`,
      type: 'warning',
      link_url: '/catalog',
    });

    return updated;
  }

  static deleteTool(id: string, actor: ToolActor): void {
    assertStaffOrAdmin(actor);

    const tool = this.getToolById(id);

    if (ToolsRepository.hasActiveBorrowedRentals(id)) {
      throw AppError.badRequest('Cannot delete tool while units are currently borrowed');
    }

    const deleted = ToolsRepository.delete(id);
    if (!deleted) {
      throw AppError.notFound('Tool not found');
    }

    AuditService.record({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TOOL_DELETED',
      target_type: 'tool',
      target_id: id,
      details: `Removed catalog item "${tool.name}" from inventory`,
    });

    NotificationsService.create({
      user_id: actor.id,
      title: 'Inventory Update: Tool Removed',
      message: `"${tool.name}" was removed from inventory.`,
      type: 'warning',
      link_url: '/catalog',
    });
  }
}
