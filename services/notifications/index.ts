/**
 * Notifications Service
 * Alerts, webhooks, email
 */

// Placeholder - will extract notification logic
export interface Notification {
  id: string;
  type: 'alert' | 'webhook' | 'email';
  recipient: string;
  message: string;
  sentAt: Date;
}