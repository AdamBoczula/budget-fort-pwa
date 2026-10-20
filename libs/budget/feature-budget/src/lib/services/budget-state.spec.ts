// spec: docs/specs/budget/planowanie-budzetu.md

import { TestBed } from '@angular/core/testing';
import { BudgetState } from './budget-state';
import { BudgetService, CategoryBudgetService } from '@data-access-budget';
import { TransactionService } from '@data-access-transaction';

// Helper: create transactions in the current month
function currentMonthExpenseTransactions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return [
    {
      id: '1',
      amount: -2000,
      date: `${year}-${month}-05T12:00:00.000Z`,
      categoryId: '1',
      accountId: 'cash',
      comment: 'Groceries',
    },
    {
      id: '2',
      amount: -800,
      date: `${year}-${month}-10T12:00:00.000Z`,
      categoryId: '2',
      accountId: 'cash',
      comment: 'Bus ticket',
    },
    {
      id: '3',
      amount: -400,
      date: `${year}-${month}-15T12:00:00.000Z`,
      categoryId: '1',
      accountId: 'cash',
    },
    {
      id: '4',
      amount: 1000,
      date: `${year}-${month}-20T12:00:00.000Z`,
      categoryId: 'income',
      accountId: 'bank',
    },
    {
      id: '5',
      amount: -50,
      date: `${year}-${month}-22T12:00:00.000Z`,
      categoryId: '3',
      accountId: 'cash',
    },
  ];
}

describe('BudgetState', () => {
  function setup(options?: {
    budgetAmount?: number;
    noBudget?: boolean;
    categoryBudgets?: Array<{
      id: number;
      categoryId: string;
      categoryName: string;
      amount: number;
      updatedAt: string;
    }>;
    transactions?: ReturnType<typeof currentMonthExpenseTransactions>;
  }) {
    const txs = options?.transactions ?? currentMonthExpenseTransactions();

    const mockBudgetService = {
      getBudget: vi
        .fn()
        .mockResolvedValue(
          options?.noBudget
            ? undefined
            : {
                id: 1,
                amount: options?.budgetAmount ?? 5000,
                updatedAt: '2026-10-01T00:00:00.000Z',
              },
        ),
      saveBudget: vi.fn(),
    };

    const mockCategoryBudgetService = {
      getAll: vi.fn().mockResolvedValue(
        options?.categoryBudgets ?? [
          {
            id: 1,
            categoryId: '1',
            categoryName: 'Jedzenie',
            amount: 1500,
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
          {
            id: 2,
            categoryId: '2',
            categoryName: 'Transport',
            amount: 500,
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
        ],
      ),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByCategoryId: vi.fn(),
    };

    const mockTransactionService = {
      getTransactionsAsync: vi.fn().mockResolvedValue(txs),
    };

    TestBed.configureTestingModule({
      providers: [
        BudgetState,
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: CategoryBudgetService, useValue: mockCategoryBudgetService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    });

    const state = TestBed.inject(BudgetState);
    return { state, mockBudgetService, mockCategoryBudgetService };
  }

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  it('should compute overall progress correctly', async () => {
    const { state } = setup({});

    // Resources are async — wait for them to resolve
    await vi.waitFor(
      () => {
        const progress = state.overallProgress();
        expect(progress.spent).toBe(3250);
        expect(progress.limit).toBe(5000);
        expect(progress.percentage).toBe(65);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should return 0% when budget amount is 0', async () => {
    const { state } = setup({ budgetAmount: 0 });

    await vi.waitFor(
      () => {
        const progress = state.overallProgress();
        expect(progress.limit).toBe(0);
        expect(progress.percentage).toBe(0);
        expect(progress.spent).toBe(3250);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 1
  it('should return limit=0 and percentage=0 when budget not set', async () => {
    const { state } = setup({ noBudget: true });

    await vi.waitFor(
      () => {
        const progress = state.overallProgress();
        expect(progress.limit).toBe(0);
        expect(progress.percentage).toBe(0);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-8
  it('should only count expense transactions (not income)', async () => {
    const { state } = setup({});

    await vi.waitFor(
      () => {
        const progress = state.overallProgress();
        expect(progress.spent).toBe(3250);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should compute category-level progress for categories with limits', async () => {
    const { state } = setup({});

    await vi.waitFor(
      () => {
        const progresses = state.categoryProgresses();
        expect(progresses.length).toBe(2);

        const jedzenie = progresses.find((p) => p.categoryName === 'Jedzenie')!;
        expect(jedzenie).toBeDefined();
        expect(jedzenie.spent).toBe(2400);
        expect(jedzenie.limit).toBe(1500);
        expect(jedzenie.percentage).toBe(100);

        const transport = progresses.find((p) => p.categoryName === 'Transport')!;
        expect(transport).toBeDefined();
        expect(transport.spent).toBe(800);
        expect(transport.limit).toBe(500);
        expect(transport.percentage).toBe(100);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-7
  it('should not include categories without limits', async () => {
    const { state } = setup({
      categoryBudgets: [
        {
          id: 1,
          categoryId: '1',
          categoryName: 'Jedzenie',
          amount: 1500,
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    });

    await vi.waitFor(
      () => {
        const progresses = state.categoryProgresses();
        expect(progresses.length).toBe(1);
        expect(progresses[0].categoryName).toBe('Jedzenie');
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-6
  it('should compute category progress with correct percentage', async () => {
    const { state } = setup({
      categoryBudgets: [
        {
          id: 1,
          categoryId: '1',
          categoryName: 'Jedzenie',
          amount: 3000,
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          id: 2,
          categoryId: '2',
          categoryName: 'Transport',
          amount: 800,
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    });

    await vi.waitFor(
      () => {
        const progresses = state.categoryProgresses();
        const jedzenie = progresses.find((p) => p.categoryName === 'Jedzenie')!;
        expect(jedzenie.spent).toBe(2400);
        expect(jedzenie.limit).toBe(3000);
        expect(jedzenie.percentage).toBe(80);

        const transport = progresses.find((p) => p.categoryName === 'Transport')!;
        expect(transport.spent).toBe(800);
        expect(transport.limit).toBe(800);
        expect(transport.percentage).toBe(100);
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 3
  it('should return 0% progress when no transactions', async () => {
    const { state } = setup({ transactions: [] });

    await vi.waitFor(
      () => {
        const progress = state.overallProgress();
        expect(progress.spent).toBe(0);
        expect(progress.percentage).toBe(0);

        const categoryProgresses = state.categoryProgresses();
        for (const cp of categoryProgresses) {
          expect(cp.spent).toBe(0);
          expect(cp.percentage).toBe(0);
        }
      },
      { timeout: 3000 },
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-10
  it('should exclude categories with limit = 0', async () => {
    const { state } = setup({
      categoryBudgets: [
        {
          id: 1,
          categoryId: '1',
          categoryName: 'Jedzenie',
          amount: 0,
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          id: 2,
          categoryId: '2',
          categoryName: 'Transport',
          amount: 500,
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    });

    await vi.waitFor(
      () => {
        const progresses = state.categoryProgresses();
        expect(progresses.length).toBe(1);
        expect(progresses[0].categoryName).toBe('Transport');
      },
      { timeout: 3000 },
    );
  });
});
