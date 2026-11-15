// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md

import { TestBed } from '@angular/core/testing';
import { AnnouncementService, DISMISSED_ANNOUNCEMENT_PREFIX } from './announcement.service';
import { SystemAnnouncement } from '../models/announcement.model';

describe('AnnouncementService', () => {
  let service: AnnouncementService;

  const validAnnouncement: SystemAnnouncement = {
    id: 'ann-1',
    title: 'Prace serwisowe',
    message: 'Nocne wdrożenie nowej wersji bazy danych.',
    severity: 'warning',
    startDate: new Date(Date.now() - 3600000).toISOString(), // 1h ago
    endDate: new Date(Date.now() + 3600000).toISOString(), // in 1h
    dismissible: true,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AnnouncementService],
    });
    service = TestBed.inject(AnnouncementService);
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  it('should set active announcement when within time window and not dismissed', () => {
    service.setAnnouncement(validAnnouncement);
    expect(service.activeAnnouncement()).toEqual(validAnnouncement);
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  it('should ignore announcement if time window has passed or is in the future', () => {
    const expiredAnnouncement: SystemAnnouncement = {
      ...validAnnouncement,
      id: 'expired',
      startDate: new Date(Date.now() - 7200000).toISOString(),
      endDate: new Date(Date.now() - 3600000).toISOString(),
    };

    service.setAnnouncement(expiredAnnouncement);
    expect(service.activeAnnouncement()).toBeNull();

    const futureAnnouncement: SystemAnnouncement = {
      ...validAnnouncement,
      id: 'future',
      startDate: new Date(Date.now() + 3600000).toISOString(),
      endDate: new Date(Date.now() + 7200000).toISOString(),
    };

    service.setAnnouncement(futureAnnouncement);
    expect(service.activeAnnouncement()).toBeNull();
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-4
  it('should dismiss active announcement and persist flag in localStorage', () => {
    service.setAnnouncement(validAnnouncement);
    expect(service.activeAnnouncement()).toEqual(validAnnouncement);

    service.dismissCurrent();

    expect(service.activeAnnouncement()).toBeNull();
    expect(localStorage.getItem(`${DISMISSED_ANNOUNCEMENT_PREFIX}ann-1`)).toBe('true');

    // Should not reappear on subsequent setAnnouncement calls
    service.setAnnouncement(validAnnouncement);
    expect(service.activeAnnouncement()).toBeNull();
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-4
  it('should not dismiss if dismissible is false', () => {
    const nonDismissible: SystemAnnouncement = {
      ...validAnnouncement,
      id: 'critical-1',
      dismissible: false,
    };

    service.setAnnouncement(nonDismissible);
    service.dismissCurrent();

    expect(service.activeAnnouncement()).toEqual(nonDismissible);
    expect(localStorage.getItem(`${DISMISSED_ANNOUNCEMENT_PREFIX}critical-1`)).toBeNull();
  });
});
