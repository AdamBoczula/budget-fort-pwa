// spec: docs/specs/sync/01-firestore-sync.md

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SyncEngineService, SyncState, SyncStatus } from '@data-access-sync';
import { SyncStatusComponent } from './sync-status.component';

describe('SyncStatusComponent', () => {
  let fixture: ComponentFixture<SyncStatusComponent>;

  let mockStatusSignal: ReturnType<typeof signal<SyncStatus>>;
  let mockPendingCountSignal: ReturnType<typeof signal<number>>;
  let mockSyncNowFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockStatusSignal = signal<SyncStatus>('idle');
    mockPendingCountSignal = signal<number>(0);
    mockSyncNowFn = vi.fn(async () => undefined);

    const mockSyncState = {
      status: mockStatusSignal,
      isSyncing: signal(false),
      isOffline: signal(false),
      isError: signal(false),
      isGuest: signal(false),
      pendingCount: mockPendingCountSignal,
    };

    const mockSyncEngine = {
      syncNow: mockSyncNowFn,
    };

    await TestBed.configureTestingModule({
      imports: [SyncStatusComponent],
      providers: [
        { provide: SyncState, useValue: mockSyncState },
        { provide: SyncEngineService, useValue: mockSyncEngine },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusComponent);
    fixture.detectChanges();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should render cloud_done icon when status is idle', () => {
    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconElement.nativeElement.textContent.trim()).toBe('cloud_done');
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should render sync icon when status is syncing', () => {
    mockStatusSignal.set('syncing');
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconElement.nativeElement.textContent.trim()).toBe('sync');
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should render cloud_off icon when status is offline', () => {
    mockStatusSignal.set('offline');
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconElement.nativeElement.textContent.trim()).toBe('cloud_off');
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should render sync_problem and call syncNow when clicked in error state', () => {
    mockStatusSignal.set('error');
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconElement.nativeElement.textContent.trim()).toBe('sync_problem');

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBe(false);

    button.nativeElement.click();
    expect(mockSyncNowFn).toHaveBeenCalled();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should show pending badge when pendingCount > 0 and not syncing', () => {
    mockPendingCountSignal.set(3);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.bf-sync-status__badge'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent.trim()).toBe('3');
  });
});
