// spec: docs/specs/sync/01-firestore-sync.md

import { TestBed } from '@angular/core/testing';
import { SyncState } from './sync.state';

describe('SyncState', () => {
  let state: SyncState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyncState],
    });
    state = TestBed.inject(SyncState);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should initialize with idle status', () => {
    expect(state.status()).toBe('idle');
    expect(state.pendingCount()).toBe(0);
    expect(state.errorMessage()).toBeNull();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should update status and computed flags correctly', () => {
    state.setSyncing();
    expect(state.isSyncing()).toBe(true);

    state.setOffline();
    expect(state.isOffline()).toBe(true);

    state.setError('Failed to connect');
    expect(state.isError()).toBe(true);
    expect(state.errorMessage()).toBe('Failed to connect');

    state.setGuest();
    expect(state.isGuest()).toBe(true);

    state.setIdle();
    expect(state.status()).toBe('idle');
    expect(state.errorMessage()).toBeNull();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should update pendingCount and lastSyncedAt', () => {
    state.setPendingCount(5);
    expect(state.pendingCount()).toBe(5);

    const now = new Date().toISOString();
    state.setLastSyncedAt(now);
    expect(state.lastSyncedAt()).toBe(now);
  });
});
