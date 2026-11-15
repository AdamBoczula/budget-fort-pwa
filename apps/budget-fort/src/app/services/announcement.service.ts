// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md
// uc: UC-3

import { Injectable, signal } from '@angular/core';
import { SystemAnnouncement } from '../models/announcement.model';

export const DISMISSED_ANNOUNCEMENT_PREFIX = 'dismissed_announcement_';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  readonly activeAnnouncement = signal<SystemAnnouncement | null>(null);

  constructor() {
    this.init();
  }

  init(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localAnnouncement = window.localStorage.getItem('bf_active_announcement');
      if (localAnnouncement) {
        try {
          const parsed = JSON.parse(localAnnouncement);
          this.setAnnouncement(parsed);
        } catch {
          // ignore parse error
        }
      }
    }
  }

  setAnnouncement(announcement: SystemAnnouncement | null): void {
    if (!announcement) {
      this.activeAnnouncement.set(null);
      return;
    }

    if (this.isDismissed(announcement.id)) {
      this.activeAnnouncement.set(null);
      return;
    }

    if (this.isActive(announcement)) {
      this.activeAnnouncement.set(announcement);
    } else {
      this.activeAnnouncement.set(null);
    }
  }

  dismissCurrent(): void {
    const current = this.activeAnnouncement();
    if (current?.dismissible) {
      this.markDismissed(current.id);
      this.activeAnnouncement.set(null);
    }
  }

  isDismissed(id: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(`${DISMISSED_ANNOUNCEMENT_PREFIX}${id}`) === 'true';
  }

  private markDismissed(id: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${DISMISSED_ANNOUNCEMENT_PREFIX}${id}`, 'true');
    }
  }

  private isActive(announcement: SystemAnnouncement): boolean {
    const now = new Date().getTime();
    const start = new Date(announcement.startDate).getTime();
    const end = new Date(announcement.endDate).getTime();

    return now >= start && now <= end;
  }
}
