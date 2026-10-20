// spec: docs/specs/budget/planowanie-budzetu.md

import { TestBed } from '@angular/core/testing';
import { LocalDbService, BUDGET_DB_TOKEN } from 'local-db';
import { BudgetService } from './budget.service';
import type { Budget } from '../model/budget.type';

function createMockTable() {
  const store: Budget[] = [];
  return {
    get: vi.fn(async (id: number) => store.find((b) => b.id === id) ?? undefined),
    put: vi.fn(async (item: Budget) => {
      const idx = store.findIndex((b) => b.id === item.id);
      if (idx >= 0) {
        store[idx] = { ...item };
      } else {
        store.push({ ...item });
      }
      return item.id;
    }),
    _store: store,
  } satisfies Record<string, unknown>;
}

describe('BudgetService', () => {
  let service: BudgetService;
  let mockTable: ReturnType<typeof createMockTable>;

  beforeEach(() => {
    mockTable = createMockTable();

    TestBed.configureTestingModule({
      providers: [
        BudgetService,
        {
          provide: LocalDbService,
          useValue: { getTable: () => mockTable },
        },
      ],
    });

    service = TestBed.inject(BudgetService);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should save a budget (upsert with id=1)', async () => {
    await service.saveBudget(5000);

    const budget = mockTable._store[0];
    expect(budget).toBeDefined();
    expect(budget.id).toBe(1);
    expect(budget.amount).toBe(5000);
    expect(budget.updatedAt).toBeTruthy();
    expect(typeof budget.updatedAt).toBe('string');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-9
  it('should update an existing budget amount', async () => {
    await service.saveBudget(3000);
    await service.saveBudget(6000);

    const budget = mockTable._store[0];
    expect(budget.id).toBe(1);
    expect(budget.amount).toBe(6000);
    expect(mockTable.put).toHaveBeenCalledTimes(2);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should get the budget (id=1)', async () => {
    await service.saveBudget(5000);

    const result = await service.getBudget();
    expect(result).toBeDefined();
    expect(result!.id).toBe(1);
    expect(result!.amount).toBe(5000);
    expect(typeof result!.updatedAt).toBe('string');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#UC-1
  it('should return undefined when no budget has been saved', async () => {
    const result = await service.getBudget();
    expect(result).toBeUndefined();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 1
  it('should allow saving a budget with amount = 0', async () => {
    await service.saveBudget(0);

    const budget = mockTable._store[0];
    expect(budget.amount).toBe(0);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 7
  it('should accept amounts with decimal places', async () => {
    await service.saveBudget(1234.56);

    const budget = mockTable._store[0];
    expect(budget.amount).toBe(1234.56);
  });
});
