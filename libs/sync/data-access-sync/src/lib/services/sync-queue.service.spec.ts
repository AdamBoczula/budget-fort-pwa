// spec: docs/specs/sync/01-firestore-sync.md

import { TestBed } from '@angular/core/testing';
import { LocalDbService, SyncQueueItem } from 'local-db';
import { SyncQueueService } from './sync-queue.service';

function createMockSyncQueueTable(): Record<string, unknown> {
  const store: SyncQueueItem[] = [];

  return {
    _store: store,
    where: vi.fn((field: string) => ({
      equals: vi.fn((val: string) => ({
        and: vi.fn((predicate: (item: SyncQueueItem) => boolean) => ({
          first: vi.fn(async () =>
            store.find(
              (item) =>
                (item as unknown as Record<string, unknown>)[field] === val && predicate(item),
            ),
          ),
        })),
      })),
    })),
    put: vi.fn(async (item: SyncQueueItem) => {
      const idx = store.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        store[idx] = { ...item };
      } else {
        store.push({ ...item });
      }
      return item.id;
    }),
    get: vi.fn(async (id: string) => store.find((i) => i.id === id)),
    delete: vi.fn(async (id: string) => {
      const idx = store.findIndex((i) => i.id === id);
      if (idx >= 0) {
        store.splice(idx, 1);
      }
    }),
    bulkDelete: vi.fn(async (ids: string[]) => {
      const set = new Set(ids);
      const remaining = store.filter((i) => !set.has(i.id));
      store.length = 0;
      store.push(...remaining);
    }),
    count: vi.fn(async () => store.length),
    clear: vi.fn(async () => {
      store.length = 0;
    }),
    orderBy: vi.fn(() => ({
      limit: vi.fn((limit: number) => ({
        toArray: vi.fn(async () => store.slice(0, limit)),
      })),
    })),
  };
}

describe('SyncQueueService', () => {
  let service: SyncQueueService;
  let mockTable: ReturnType<typeof createMockSyncQueueTable>;

  beforeEach(() => {
    mockTable = createMockSyncQueueTable();

    TestBed.configureTestingModule({
      providers: [
        SyncQueueService,
        {
          provide: LocalDbService,
          useValue: {
            getTable: () => mockTable,
          },
        },
      ],
    });

    service = TestBed.inject(SyncQueueService);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-1
  it('should enqueue a new sync operation', async () => {
    const item = await service.enqueue('transaction', 'tx-1', 'upsert', {
      amount: 100,
    });

    expect(item).toBeDefined();
    expect(item.entityId).toBe('tx-1');
    expect(item.store).toBe('transaction');
    expect(mockTable._store.length).toBe(1);
    expect(mockTable.put).toHaveBeenCalled();
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-1
  it('should update existing queued operation if same entityId and store', async () => {
    await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 200 });

    expect(mockTable._store.length).toBe(1);
    expect(mockTable._store[0].payload).toEqual({ amount: 200 });
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should peek pending items in order', async () => {
    await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    await service.enqueue('category', 'cat-1', 'upsert', { name: 'Food' });

    const items = await service.peek(10);
    expect(items.length).toBe(2);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should remove processed items from the queue', async () => {
    const item = await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    await service.remove(item.id);

    expect(mockTable._store.length).toBe(0);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should remove multiple processed items at once', async () => {
    const i1 = await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    const i2 = await service.enqueue('transaction', 'tx-2', 'upsert', { amount: 200 });

    await service.removeMany([i1.id, i2.id]);
    expect(mockTable._store.length).toBe(0);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should return correct pending count', async () => {
    expect(await service.getPendingCount()).toBe(0);
    await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    expect(await service.getPendingCount()).toBe(1);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should record failure and increment retryCount', async () => {
    const item = await service.enqueue('transaction', 'tx-1', 'upsert', { amount: 100 });
    await service.recordFailure(item.id, 'Network timeout');

    expect(mockTable._store[0].retryCount).toBe(1);
    expect(mockTable._store[0].lastError).toBe('Network timeout');
  });
});
