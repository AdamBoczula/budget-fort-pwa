// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { TestBed } from '@angular/core/testing';
import { SyncState } from './sync.state';
import { Household } from '../types/sync.types';

describe('SyncState', () => {
  let state: SyncState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyncState],
    });
    state = TestBed.inject(SyncState);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-8
  it('should initialize with idle status and local householdId', () => {
    expect(state.status()).toBe('idle');
    expect(state.pendingCount()).toBe(0);
    expect(state.errorMessage()).toBeNull();
    expect(state.currentHousehold()).toBeNull();
    expect(state.householdId()).toBe('local');
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
    expect(state.currentHousehold()).toBeNull();
    expect(state.householdId()).toBe('local');

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

  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  it('should update currentHousehold and computed householdId', () => {
    const mockHousehold: Household = {
      id: 'hh-123',
      name: 'Nasz Dom',
      ownerUid: 'uid-1',
      members: ['uid-1', 'uid-2'],
      inviteCode: 'DOM123',
      createdAt: '2026-11-14T10:00:00Z',
      updatedAt: '2026-11-14T10:00:00Z',
    };

    state.setCurrentHousehold(mockHousehold);
    expect(state.currentHousehold()).toEqual(mockHousehold);
    expect(state.householdId()).toBe('hh-123');

    state.setGuest();
    expect(state.currentHousehold()).toBeNull();
    expect(state.householdId()).toBe('local');
  });
});
