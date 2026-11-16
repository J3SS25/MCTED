import type {
  User,
  Tool,
  Reservation,
  Rental,
  Payment,
  Maintenance,
  Feedback,
  Notification,
  AuditLog,
} from '@mcteb/shared';

export type UserModel = User;
export type ToolModel = Tool;
export type ReservationModel = Reservation;
export type RentalModel = Rental;
export type PaymentModel = Payment;
export type MaintenanceModel = Maintenance;
export type FeedbackModel = Feedback;
export type NotificationModel = Notification;
export type AuditLogModel = AuditLog;

export interface SessionModel {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}
