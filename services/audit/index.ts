/**
 * Audit Service
 * Compliance, event retention, audit logs
 */

// Placeholder - will extract audit logic
export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}