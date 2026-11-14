// spec: docs/specs/transaction/recurring-transactions.md
import { TestBed } from '@angular/core/testing';
import { RecurringRuleStore } from './recurring-rule-store';
import { LocalDbService, RECURRING_RULE_DB_TOKEN } from 'local-db';
import { SyncQueueService } from '@data-access-sync';
import { RecurringTransactionRule } from '../model/recurring-rule.type';

describe('RecurringRuleStore', () => {
  let store: RecurringRuleStore;
  let mockTable: {
    toArray: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
  let mockSyncQueue: { enqueue: ReturnType<typeof vi.fn> };

  const sampleRule: RecurringTransactionRule = {
    id: 'rule-1',
    amount: 150,
    categoryId: 'cat-1',
    accountId: 'acc-1',
    dayOfMonth: 1,
    startDate: '2026-11-01',
    lastGeneratedMonth: '2026-11',
    isActive: true,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mockTable = {
      toArray: vi.fn().mockResolvedValue([sampleRule]),
      add: vi.fn().mockResolvedValue('rule-1'),
      put: vi.fn().mockResolvedValue('rule-1'),
      get: vi.fn().mockResolvedValue(sampleRule),
    };

    mockSyncQueue = {
      enqueue: vi.fn().mockResolvedValue(undefined),
    };

    const mockLocalDbService = {
      getTable: vi.fn((token: string) => {
        if (token === RECURRING_RULE_DB_TOKEN) {
          return mockTable;
        }
        return null;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        RecurringRuleStore,
        { provide: LocalDbService, useValue: mockLocalDbService },
        { provide: SyncQueueService, useValue: mockSyncQueue },
      ],
    });

    store = TestBed.inject(RecurringRuleStore);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should retrieve all non-deleted rules', async () => {
    const rules = await store.getRulesAsync();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('rule-1');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-1
  it('should add a rule and enqueue upsert to sync queue', async () => {
    const newRule: RecurringTransactionRule = {
      id: 'rule-2',
      amount: 50,
      categoryId: 'cat-2',
      accountId: 'acc-1',
      dayOfMonth: 15,
      startDate: '2026-11-15',
      lastGeneratedMonth: '2026-11',
      isActive: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };

    await store.addRuleAsync(newRule);
    expect(mockTable.add).toHaveBeenCalledWith(newRule);
    expect(mockSyncQueue.enqueue).toHaveBeenCalledWith(
      'recurringRule',
      'rule-2',
      'upsert',
      newRule,
    );
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should soft delete rule and enqueue delete to sync queue', async () => {
    await store.deleteRuleAsync('rule-1');
    expect(mockTable.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-1',
        isDeleted: true,
      }),
    );
    expect(mockSyncQueue.enqueue).toHaveBeenCalledWith('recurringRule', 'rule-1', 'delete', null);
  });
});
