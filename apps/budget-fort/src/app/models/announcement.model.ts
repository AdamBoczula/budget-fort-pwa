// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md
// uc: UC-3

export type AnnouncementSeverity = 'info' | 'warning' | 'critical';

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: AnnouncementSeverity;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  dismissible: boolean;
}
