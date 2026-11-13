// spec: docs/specs/sync/01-firestore-sync.md

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
    pushBatch: ReturnType<typeof vi.fn>;
    pullChanges: ReturnType<typeof vi.fn>;
    pullAll: ReturnType<typeof vi.fn>;
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
      pushBatch: vi.fn(async () => []),
      pullChanges: vi.fn(async () => []),
      pullAll: vi.fn(async () => ({
        category: [],
        subcategory: [],
        transaction: [],
        budget: [],
        categoryBudget: [],
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
  it('should push pending changes and remove processed IDs', async () => {
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

    expect(mockFirestore.pushBatch).toHaveBeenCalledWith('test-user-1', queueItems);
    expect(mockQueue.removeMany).toHaveBeenCalledWith(['q-1']);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-3
  it('should apply Last-Write-Wins (LWW) conflict resolution during pull', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setLastSyncedAt('2026-11-13T10:00:00Z');

    // Remote has newer updatedAt
    mockFirestore.pullChanges.mockImplementation(async (uid, store) => {
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

    // Local has older updatedAt
    mockLocalTable.get.mockResolvedValueOnce({
      id: 'tx-1',
      amount: 100,
      updatedAt: '2026-11-13T11:00:00Z',
    });

    await service.syncNow();

    expect(mockLocalTable.put).toHaveBeenCalledWith({
      id: 'tx-1',
      amount: 150,
      updatedAt: '2026-11-13T12:00:00Z',
    });
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-3
  it('should keep local version if local is newer than remote during pull', async () => {
    const syncState = TestBed.inject(SyncState);
    syncState.setLastSyncedAt('2026-11-13T10:00:00Z');

    // Remote has older updatedAt
    mockFirestore.pullChanges.mockImplementation(async (uid, store) => {
      if (store === 'transaction') {
        return [
          {
            id: 'tx-1',
            amount: 150,
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

    // put should not be called since local is newer
    expect(mockLocalTable.put).not.toHaveBeenCalled();
  });
});
