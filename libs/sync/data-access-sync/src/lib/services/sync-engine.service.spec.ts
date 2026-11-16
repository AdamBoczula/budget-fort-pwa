// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md
// spec: docs/specs/sync/03-household-invite-link.md

import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@data-access-auth';
import { LocalDbService } from 'local-db';
import { SyncState } from '../state/sync.state';
import { getPendingInviteCode, setPendingInviteCode } from '../utils/invite-link.utils';
import { FirestoreSyncService } from './firestore-sync.service';
import { NetworkStatusService } from './network-status.service';
import { SyncEngineService } from './sync-engine.service';
import { SyncQueueService } from './sync-queue.service';

describe('SyncEngineService', () => {
  let service: SyncEngineService;
  let mockNetwork: { isOnline: ReturnType<typeof signal<boolean>> };
  let mockAuth: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    isGuest: ReturnType<typeof signal<boolean>>;
    currentUser: ReturnType<typeof signal<{ uid: string; email: string } | null>>;
    onLogout$: Subject<void>;
  };
  let mockQueue: {
    peek: ReturnType<typeof vi.fn>;
    removeMany: ReturnType<typeof vi.fn>;
    getPendingCount: ReturnType<typeof vi.fn>;
    enqueue: ReturnType<typeof vi.fn>;
    queued$: Subject<void>;
  };
  let mockFirestore: {
    isAvailable: ReturnType<typeof vi.fn>;
    pushBatch: ReturnType<typeof vi.fn>;
    pullChanges: ReturnType<typeof vi.fn>;
    pullAll: ReturnType<typeof vi.fn>;
    getOrCreateHousehold: ReturnType<typeof vi.fn>;
    joinHouseholdByInviteCode: ReturnType<typeof vi.fn>;
  };
  let mockLocalTable: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    bulkPut: ReturnType<typeof vi.fn>;
    toArray: ReturnType<typeof vi.fn>;
  };
  let mockClearAllTables: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNetwork = { isOnline: signal(true) };
    mockAuth = {
      isAuthenticated: signal(true),
      isGuest: signal(false),
      currentUser: signal({ uid: 'test-user-1', email: 'test@example.com' }),
      onLogout$: new Subject<void>(),
    };

    mockQueue = {
      peek: vi.fn(async () => []),
      removeMany: vi.fn(async () => undefined),
      getPendingCount: vi.fn(async () => 0),
      enqueue: vi.fn(async () => undefined),
      queued$: new Subject<void>(),
    };

    mockFirestore = {
      isAvailable: vi.fn(() => true),
      pushBatch: vi.fn(async () => []),
      pullChanges: vi.fn(async () => []),
      pullAll: vi.fn(async () => ({
        category: [],
        subcategory: [],
        transaction: [],
        budget: [],
        categoryBudget: [],
        recurringRule: [],
      })),
      getOrCreateHousehold: vi.fn(async (user) => ({
        id: `hh-${user.uid}`,
        name: 'Budżet Domowy',
        ownerUid: user.uid,
        members: [user.uid],
        inviteCode: 'BFTEST',
        createdAt: '2026-11-14T10:00:00Z',
        updatedAt: '2026-11-14T10:00:00Z',
        isDeleted: false,
      })),
      joinHouseholdByInviteCode: vi.fn(async (code, user) => ({
        id: 'hh-partner',
        name: 'Budżet Partnera',
        ownerUid: 'partner-uid',
        members: ['partner-uid', user.uid],
        inviteCode: code,
        createdAt: '2026-11-14T10:00:00Z',
        updatedAt: '2026-11-14T10:00:00Z',
        isDeleted: false,
      })),
    };

    mockLocalTable = {
      get: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      update: vi.fn(async () => 1),
      bulkPut: vi.fn(async () => undefined),
      toArray: vi.fn(async () => []),
    };

    mockClearAllTables = vi.fn(async () => undefined);

    TestBed.configureTestingModule({
      providers: [
        SyncEngineService,
        SyncState,
        { provide: NetworkStatusService, useValue: mockNetwork },
        { provide: AuthService, useValue: mockAuth },
        { provide: SyncQueueService, useValue: mockQueue },
        { provide: FirestoreSyncService, useValue: mockFirestore },
        {
          provide: LocalDbService,
          useValue: {
            getTable: () => mockLocalTable,
            clearAllTables: mockClearAllTables,
          },
        },
      ],
    });

    service = TestBed.inject(SyncEngineService);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-5
  it('should not sync when user is in guest mode', async () => {
    mockAuth.isGuest.set(true);
    await service.syncNow();

    expect(mockFirestore.pushBatch).not.toHaveBeenCalled();
    expect(mockFirestore.pullChanges).not.toHaveBeenCalled();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  // covers: docs/specs/sync/02-multi-user-household.md#AC-3
  it('should resolve household and push pending changes to household path', async () => {
    const queueItems = [
      {
        id: 'q-1',
        store: 'transaction' as const,
        entityId: 'tx-1',
        operation: 'upsert' as const,
        payload: { amount: 50 },
        createdAt: '2026-11-13T10:00:00Z',
        retryCount: 0,
      },
    ];

    mockQueue.peek.mockResolvedValueOnce(queueItems).mockResolvedValueOnce([]);
    mockFirestore.pushBatch.mockResolvedValueOnce(['q-1']);

    await service.syncNow();

    expect(mockFirestore.getOrCreateHousehold).toHaveBeenCalled();
    expect(mockFirestore.pushBatch).toHaveBeenCalledWith('hh-test-user-1', queueItems);
    expect(mockQueue.removeMany).toHaveBeenCalledWith(['q-1']);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-3
  // covers: docs/specs/sync/02-multi-user-household.md#AC-6
  it('should apply Field-level Last-Write-Wins (LWW) conflict resolution during pull', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setLastSyncedAt('2026-11-13T10:00:00Z');

    // Remote has newer updatedAt and updated amount
    mockFirestore.pullChanges.mockImplementation(async (hid, store) => {
      if (store === 'transaction') {
        return [
          {
            id: 'tx-1',
            amount: 150,
            updatedAt: '2026-11-13T12:00:00Z',
          },
        ];
      }
      return [];
    });

    // Local has older updatedAt and an existing comment field
    mockLocalTable.get.mockResolvedValueOnce({
      id: 'tx-1',
      amount: 100,
      comment: 'Wspolne zakupy',
      updatedAt: '2026-11-13T11:00:00Z',
    });

    await service.syncNow();

    expect(mockLocalTable.put).toHaveBeenCalledWith({
      id: 'tx-1',
      amount: 150,
      comment: 'Wspolne zakupy',
      updatedAt: '2026-11-13T12:00:00Z',
    });
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-3
  // covers: docs/specs/sync/02-multi-user-household.md#AC-6
  it('should merge fields preserving local changes when local is newer during pull', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setLastSyncedAt('2026-11-13T10:00:00Z');

    // Remote has older updatedAt
    mockFirestore.pullChanges.mockImplementation(async (hid, store) => {
      if (store === 'transaction') {
        return [
          {
            id: 'tx-1',
            amount: 150,
            authorName: 'Anna',
            updatedAt: '2026-11-13T10:30:00Z',
          },
        ];
      }
      return [];
    });

    // Local has newer updatedAt
    mockLocalTable.get.mockResolvedValueOnce({
      id: 'tx-1',
      amount: 200,
      updatedAt: '2026-11-13T11:00:00Z',
    });

    await service.syncNow();

    // Field-level LWW: preserves local amount: 200, but preserves remote authorName: 'Anna'
    expect(mockLocalTable.put).toHaveBeenCalledWith({
      id: 'tx-1',
      amount: 200,
      authorName: 'Anna',
      updatedAt: '2026-11-13T11:00:00Z',
    });
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should allow joining household by invite code and trigger initial pull', async () => {
    const household = await service.joinHousehold('BFTEST');

    expect(mockFirestore.joinHouseholdByInviteCode).toHaveBeenCalledWith('BFTEST', {
      uid: 'test-user-1',
      email: 'test@example.com',
    });
    expect(household.id).toBe('hh-partner');
    expect(mockFirestore.pullAll).toHaveBeenCalledWith('hh-partner');
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-5
  it('should auto-join household when pending invite code exists in sessionStorage', async () => {
    setPendingInviteCode('AUTO99');

    await service.syncNow();

    expect(mockFirestore.joinHouseholdByInviteCode).toHaveBeenCalledWith('AUTO99', {
      uid: 'test-user-1',
      email: 'test@example.com',
    });
    expect(getPendingInviteCode()).toBeNull();
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-5
  it('should clear invalid pending invite and fallback to getOrCreateHousehold gracefully', async () => {
    setPendingInviteCode('INVALID');
    mockFirestore.joinHouseholdByInviteCode.mockRejectedValueOnce(new Error('Invalid code'));

    await service.syncNow();

    expect(mockFirestore.joinHouseholdByInviteCode).toHaveBeenCalledWith('INVALID', {
      uid: 'test-user-1',
      email: 'test@example.com',
    });
    expect(getPendingInviteCode()).toBeNull();
    expect(mockFirestore.getOrCreateHousehold).toHaveBeenCalled();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-7
  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  it('should reset syncState and clear local tables when auth.onLogout$ emits', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setCurrentHousehold({
      id: 'hh-1',
      name: 'Dom',
      ownerUid: 'uid-1',
      members: ['uid-1'],
      inviteCode: 'CODE1',
      createdAt: '2026-11-14T10:00:00Z',
      updatedAt: '2026-11-14T10:00:00Z',
    });

    mockAuth.onLogout$.next();
    await Promise.resolve();

    expect(syncState.currentHousehold()).toBeNull();
    expect(syncState.householdId()).toBe('local');
    expect(mockClearAllTables).toHaveBeenCalled();
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-3
  it('should notify data synced when initialPull receives items', async () => {
    const syncState = TestBed.inject(SyncState);
    const initialVersion = syncState.syncVersion();

    mockFirestore.pullAll.mockResolvedValueOnce({
      category: [{ id: 'cat-1', name: 'Jedzenie' }],
      subcategory: [],
      transaction: [{ id: 'tx-1', amount: 50 }],
      budget: [],
      categoryBudget: [],
      recurringRule: [],
    });

    await service.initialPull('hh-test');

    expect(syncState.syncVersion()).toBeGreaterThan(initialVersion);
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  it('should reset household and fetch new if current household does not include current user', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setCurrentHousehold({
      id: 'hh-other-user',
      name: 'Obcy Dom',
      ownerUid: 'other-uid',
      members: ['other-uid'],
      inviteCode: 'OTHER1',
      createdAt: '2026-11-14T10:00:00Z',
      updatedAt: '2026-11-14T10:00:00Z',
    });

    // Current user is test-user-1 (not in members of hh-other-user)
    await service.syncNow();

    expect(mockFirestore.getOrCreateHousehold).toHaveBeenCalledWith({
      uid: 'test-user-1',
      email: 'test@example.com',
    });
    expect(syncState.householdId()).toBe('hh-test-user-1');
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-3
  // covers: docs/specs/sync/02-multi-user-household.md#AC-3
  it('should query pullChanges with lookback safety window to capture offline transactions created with earlier timestamps', async () => {
    const syncState = TestBed.inject(SyncState);
    const lastSynced = '2026-11-15T19:35:00.000Z';
    syncState.setLastSyncedAt(lastSynced);

    // Device A added tx-offline at 19:34:00 (earlier than lastSynced 19:35:00)
    mockFirestore.pullChanges.mockImplementation(async (hid, store, safeSince) => {
      // safeSince must be earlier than lastSynced by lookback margin (24h)
      expect(new Date(safeSince).getTime()).toBeLessThan(
        new Date('2026-11-15T19:34:00.000Z').getTime(),
      );
      if (store === 'transaction') {
        return [
          {
            id: 'tx-offline-4fd3d',
            amount: -200,
            date: '2026-11-15T19:34:26.617Z',
            updatedAt: '2026-11-15T19:34:26.617Z',
          },
        ];
      }
      return [];
    });

    await service.syncNow();

    expect(mockLocalTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-offline-4fd3d',
        amount: -200,
      }),
    );
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should update local item timestamp when pushed successfully', async () => {
    const queueItems = [
      {
        id: 'q-push-1',
        store: 'transaction' as const,
        entityId: 'tx-offline-1',
        operation: 'upsert' as const,
        payload: { id: 'tx-offline-1', amount: 99, updatedAt: '2026-11-15T19:40:00.000Z' },
        createdAt: '2026-11-15T19:34:00.000Z',
        retryCount: 0,
      },
    ];

    mockQueue.peek.mockResolvedValueOnce(queueItems).mockResolvedValueOnce([]);
    mockFirestore.pushBatch.mockResolvedValueOnce(['q-push-1']);

    await service.syncNow();

    expect(mockLocalTable.update).toHaveBeenCalledWith('tx-offline-1', {
      updatedAt: '2026-11-15T19:40:00.000Z',
    });
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-4
  it('should delete local item when remote doc has isDeleted set to true', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setLastSyncedAt('2026-11-15T19:00:00.000Z');

    mockFirestore.pullChanges.mockImplementation(async (hid, store) => {
      if (store === 'transaction') {
        return [
          {
            id: 'tx-deleted-1',
            isDeleted: true,
            updatedAt: '2026-11-15T19:10:00.000Z',
          },
        ];
      }
      return [];
    });

    mockLocalTable.get.mockResolvedValueOnce({
      id: 'tx-deleted-1',
      amount: 100,
    });

    await service.syncNow();

    expect(mockLocalTable.delete).toHaveBeenCalledWith('tx-deleted-1');
  });
});
