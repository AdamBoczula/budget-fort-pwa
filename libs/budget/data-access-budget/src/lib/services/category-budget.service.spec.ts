// spec: docs/specs/budget/planowanie-budzetu.md

import { TestBed } from '@angular/core/testing';
import { LocalDbService, CATEGORY_BUDGET_DB_TOKEN } from 'local-db';
import { CategoryBudgetService } from './category-budget.service';
import type { CategoryBudget } from '../model/category-budget.type';

function createMockTable() {
  const store: CategoryBudget[] = [];

  const whereMock = {
    equals: vi.fn().mockReturnThis(),
    first: vi.fn(async () => undefined),
    _currentCategoryId: undefined as string | undefined,
  };

  // When equals is called, update first() to return the matching record
  whereMock.equals.mockImplementation((value: string) => {
    whereMock._currentCategoryId = value;
    whereMock.first.mockImplementation(
      async () => store.find((cb) => cb.categoryId === value) ?? undefined,
    );
    return whereMock;
  });

  return {
    get: vi.fn(async (id: number) => store.find((cb) => cb.id === id) ?? undefined),
    put: vi.fn(async (item: CategoryBudget) => {
      if (item.id === undefined) {
        throw new Error('DataError: Evaluating the object store key path did not yield a value.');
      }
      const idx = store.findIndex((cb) => cb.id === item.id);
      if (idx >= 0) {
        store[idx] = { ...item };
      } else {
        store.push({ ...item });
      }
      return item.id;
    }),
    delete: vi.fn(async (id: number) => {
      const idx = store.findIndex((cb) => cb.id === id);
      if (idx >= 0) {
        store.splice(idx, 1);
      }
    }),
    toArray: vi.fn(async () => [...store]),
    where: vi.fn(() => whereMock),
    _store: store,
  } satisfies Record<string, unknown>;
}

describe('CategoryBudgetService', () => {
  let service: CategoryBudgetService;
  let mockTable: ReturnType<typeof createMockTable>;

  beforeEach(() => {
    mockTable = createMockTable();

    TestBed.configureTestingModule({
      providers: [
        CategoryBudgetService,
        {
          provide: LocalDbService,
          useValue: {
            getTable: (token: unknown) =>
              token === CATEGORY_BUDGET_DB_TOKEN ? mockTable : createMockTable(),
          },
        },
      ],
    });

    service = TestBed.inject(CategoryBudgetService);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should save a category budget', async () => {
    await service.save('cat-1', 'Jedzenie', 1500);

    expect(mockTable._store.length).toBe(1);
    const saved = mockTable._store[0];
    expect(saved.categoryId).toBe('cat-1');
    expect(saved.categoryName).toBe('Jedzenie');
    expect(saved.amount).toBe(1500);
    expect(saved.updatedAt).toBeTruthy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should update existing category budget when saving same categoryId', async () => {
    await service.save('cat-1', 'Jedzenie', 1500);
    await service.save('cat-1', 'Jedzenie', 2000);

    expect(mockTable._store.length).toBe(1);
    expect(mockTable._store[0].amount).toBe(2000);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  it('should get all category budgets', async () => {
    await service.save('cat-1', 'Jedzenie', 1500);
    await service.save('cat-2', 'Transport', 500);

    const all = await service.getAll();
    expect(all.length).toBe(2);
    expect(all.map((cb) => cb.categoryName)).toContain('Jedzenie');
    expect(all.map((cb) => cb.categoryName)).toContain('Transport');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-7
  it('should return empty array when no category budgets exist', async () => {
    const all = await service.getAll();
    expect(all).toEqual([]);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-10
  it('should delete a category budget by id', async () => {
    await service.save('cat-fun', 'Rozrywka', 500);
    const allBefore = await service.getAll();
    const id = allBefore[0].id!;

    await service.delete(id);
    expect(mockTable._store.length).toBe(0);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-10
  it('should delete a category budget by categoryId', async () => {
    await service.save('cat-fun', 'Rozrywka', 500);

    await service.deleteByCategoryId('cat-fun');
    expect(mockTable._store.length).toBe(0);
  });
});
