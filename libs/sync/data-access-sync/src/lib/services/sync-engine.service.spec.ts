// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@data-access-auth';
import { LocalDbService } from 'local-db';
import { SyncState } from '../state/sync.state';
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
  };
  let mockQueue: {
    peek: ReturnType<typeof vi.fn>;
    removeMany: ReturnType<typeof vi.fn>;
    getPendingCount: ReturnType<typeof vi.fn>;
    enqueue: ReturnType<typeof vi.fn>;
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
    bulkPut: ReturnType<typeof vi.fn>;
    toArray: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockNetwork = { isOnline: signal(true) };
    mockAuth = {
      isAuthenticated: signal(true),
      isGuest: signal(false),
      currentUser: signal({ uid: 'test-user-1', email: 'test@example.com' }),
    };

    mockQueue = {
      peek: vi.fn(async () => []),
      removeMany: vi.fn(async () => undefined),
      getPendingCount: vi.fn(async () => 0),
      enqueue: vi.fn(async () => undefined),
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
      bulkPut: vi.fn(async () => undefined),
      toArray: vi.fn(async () => []),
    };

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
          useValue: { getTable: () => mockLocalTable },
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
});
