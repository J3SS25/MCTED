import { FeedbackRepository, type FeedbackWithDetails } from './feedback.repository.js';
import { ToolsRepository } from '../tools/tools.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../utils/errors.js';
import type { CreateFeedbackInput, ModerateFeedbackInput } from '@mcteb/shared';

export class FeedbackService {
  static getPublicReviews(toolId?: string): FeedbackWithDetails[] {
    const list = FeedbackRepository.findPublic(toolId);
    // Sanitize reviewer identity for privacy (First Name + Last Initial)
    return list.map((item) => {
      const parts = item.reviewer_name.trim().split(' ');
      const firstName = parts[0] ?? 'Resident';
      const lastInitial = parts.length > 1 && parts[parts.length - 1] ? `${parts[parts.length - 1]![0]}.` : '';
      return {
        ...item,
        reviewer_name: `${firstName} ${lastInitial}`.trim(),
      };
    });
  }

  static getAllReviews(): FeedbackWithDetails[] {
    return FeedbackRepository.findAll();
  }

  static submitFeedback(
    userId: string,
    userName: string,
    input: CreateFeedbackInput,
  ): FeedbackWithDetails {
    const tool = ToolsRepository.findById(input.tool_id);
    if (!tool) {
      throw AppError.notFound('Tool not found');
    }

    const created = FeedbackRepository.create(userId, input);

    AuditService.record({
      actor_id: userId,
      actor_name: userName,
      action: 'FEEDBACK_SUBMITTED',
      target_type: 'feedback',
      target_id: created.id,
      details: `Submitted rating for "${tool.name}": Overall ${input.overall_rating}/5`,
    });

    const item = FeedbackRepository.findById(created.id);
    if (!item) {
      throw AppError.internal('Failed to retrieve created feedback');
    }
    return item;
  }

  static moderateFeedback(
    id: string,
    input: ModerateFeedbackInput,
    moderator: { id: string; name: string },
  ): FeedbackWithDetails {
    const existing = FeedbackRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Feedback entry not found');
    }

    const updated = FeedbackRepository.moderate(id, input);
    if (!updated) {
      throw AppError.internal('Failed to moderate feedback');
    }

    AuditService.record({
      actor_id: moderator.id,
      actor_name: moderator.name,
      action: 'FEEDBACK_MODERATED',
      target_type: 'feedback',
      target_id: id,
      details: `Set public visibility to ${input.is_public} for review by "${existing.reviewer_name}"`,
    });

    const item = FeedbackRepository.findById(id);
    if (!item) {
      throw AppError.internal('Failed to retrieve moderated feedback');
    }
    return item;
  }
}

