// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MaintenanceBannerComponent } from './maintenance-banner.component';
import { AnnouncementService } from '../../services/announcement.service';
import { SystemAnnouncement } from '../../models/announcement.model';

describe('MaintenanceBannerComponent', () => {
  let fixture: ComponentFixture<MaintenanceBannerComponent>;
  let activeAnnouncementSignal: ReturnType<typeof signal<SystemAnnouncement | null>>;
  let mockAnnouncementService: {
    activeAnnouncement: typeof activeAnnouncementSignal;
    dismissCurrent: ReturnType<typeof vi.fn>;
  };

  const testAnnouncement: SystemAnnouncement = {
    id: 'plan-1',
    title: 'Uwaga',
    message: 'Nocne okno serwisowe.',
    severity: 'warning',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 3600000).toISOString(),
    dismissible: true,
  };

  beforeEach(async () => {
    activeAnnouncementSignal = signal<SystemAnnouncement | null>(null);
    mockAnnouncementService = {
      activeAnnouncement: activeAnnouncementSignal,
      init: vi.fn(),
      dismissCurrent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MaintenanceBannerComponent],
      providers: [{ provide: AnnouncementService, useValue: mockAnnouncementService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceBannerComponent);
    fixture.detectChanges();
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  it('should not render anything when there is no active announcement', () => {
    const banner = fixture.debugElement.query(By.css('.maintenance-banner'));
    expect(banner).toBeNull();
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-3
  it('should render banner with correct modifier and text when announcement is active', () => {
    activeAnnouncementSignal.set(testAnnouncement);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.maintenance-banner'));
    expect(banner).not.toBeNull();
    expect(banner.nativeElement.classList).toContain('maintenance-banner--warning');

    const title = fixture.debugElement.query(By.css('.maintenance-banner__title'));
    expect(title.nativeElement.textContent.trim()).toBe('Uwaga');

    const message = fixture.debugElement.query(By.css('.maintenance-banner__message'));
    expect(message.nativeElement.textContent.trim()).toBe('Nocne okno serwisowe.');
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-4
  it('should call dismissCurrent when close button is clicked', () => {
    activeAnnouncementSignal.set(testAnnouncement);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.maintenance-banner__close'));
    expect(closeBtn).not.toBeNull();

    closeBtn.nativeElement.click();
    expect(mockAnnouncementService.dismissCurrent).toHaveBeenCalledTimes(1);
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-4
  it('should not render close button when dismissible is false', () => {
    activeAnnouncementSignal.set({
      ...testAnnouncement,
      dismissible: false,
    });
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.maintenance-banner__close'));
    expect(closeBtn).toBeNull();
  });
});
