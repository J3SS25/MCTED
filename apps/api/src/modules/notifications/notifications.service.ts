import { NotificationsRepository } from './notifications.repository.js';
import type { Notification, CreateNotificationInput } from '@mcteb/shared';

export class NotificationsService {
  static create(input: CreateNotificationInput): Notification {
    return NotificationsRepository.create(input);
  }

  static getForUser(userId: string): Notification[] {
    return NotificationsRepository.findByUserId(userId);
  }

  static markRead(id: string, userId: string): boolean {
    return NotificationsRepository.markAsRead(id, userId);
  }

  static markAllRead(userId: string): number {
    return NotificationsRepository.markAllAsRead(userId);
  }
}

