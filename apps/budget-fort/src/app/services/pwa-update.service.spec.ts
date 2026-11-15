// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md

import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

@Injectable()
class MockPwaUpdateService extends PwaUpdateService {
  reloadCalled = false;
  protected override reloadApp(): void {
    this.reloadCalled = true;
  }
}

describe('PwaUpdateService', () => {
  let service: MockPwaUpdateService;
  let versionUpdates$: Subject<VersionEvent>;
  let mockSwUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let snackBarActionSubject: Subject<void>;

  beforeEach(() => {
    versionUpdates$ = new Subject();
    snackBarActionSubject = new Subject();

    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: versionUpdates$,
      checkForUpdate: vi.fn().mockResolvedValue(true),
      activateUpdate: vi.fn().mockResolvedValue(undefined),
    };

    const mockSnackBarRef = {
      onAction: () => snackBarActionSubject.asObservable(),
    } as unknown as MatSnackBarRef<TextOnlySnackBar>;

    mockSnackBar = {
      open: vi.fn().mockReturnValue(mockSnackBarRef),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PwaUpdateService, useClass: MockPwaUpdateService },
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(PwaUpdateService) as MockPwaUpdateService;
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-1
  it('should not register listeners or show notification if swUpdate is disabled', async () => {
    mockSwUpdate.isEnabled = false;
    service.init();

    versionUpdates$.next({ type: 'VERSION_READY' } as VersionReadyEvent);

    expect(service.isUpdateAvailable()).toBe(false);
    expect(mockSnackBar.open).not.toHaveBeenCalled();

    const checkResult = await service.checkForUpdate();
    expect(checkResult).toBe(false);
    expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-1
  it('should detect VERSION_READY and prompt user with MatSnackBar', () => {
    service.init();

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1' },
      latestVersion: { hash: 'v2' },
    } as VersionReadyEvent);

    expect(service.isUpdateAvailable()).toBe(true);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Budget Fort'),
      expect.stringContaining('Zaktualizuj'),
      expect.objectContaining({ duration: 0 }),
    );
  });

  // covers: docs/specs/pwa/01-app-update-and-maintenance-banner.md#AC-2
  it('should call activateUpdate and reload when user clicks action in snackbar', async () => {
    service.init();

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1' },
      latestVersion: { hash: 'v2' },
    } as VersionReadyEvent);

    snackBarActionSubject.next();
    // Wait for async activateUpdate
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
    expect(service.reloadCalled).toBe(true);
  });
});
