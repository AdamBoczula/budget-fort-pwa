// spec: docs/specs/budget/planowanie-budzetu.md
import {
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
} from 'local-db';
import type { Budget, CategoryBudget } from '@data-access-budget';
import type { Transaction } from '@data-access-transaction';
import {
  PREV_MONTH_BUDGET_SEED_STORAGE_KEY,
  seedPreviousMonthBudgetIfNeeded,
} from './previous-month-budget-seed';

describe('seedPreviousMonthBudgetIfNeeded', () => {
  let budgets: Budget[];
  let categoryBudgets: CategoryBudget[];
  let transactions: Transaction[];
  let mockLocalDbService: LocalDbService;

  beforeEach(() => {
    localStorage.removeItem(PREV_MONTH_BUDGET_SEED_STORAGE_KEY);
    budgets = [];
    categoryBudgets = [];
    transactions = [];

    const budgetTable = {
      put: vi.fn(async (record: Budget) => {
        budgets.push(record);
      }),
    };

    const categoryBudgetTable = {
      count: vi.fn(async () => categoryBudgets.length),
      bulkPut: vi.fn(async (records: CategoryBudget[]) => {
        categoryBudgets.push(...records);
      }),
    };

    const transactionTable = {
      bulkPut: vi.fn(async (records: Transaction[]) => {
        transactions.push(...records);
      }),
    };

    mockLocalDbService = {
      getTable: vi.fn((token: string) => {
        if (token === BUDGET_DB_TOKEN) {
          return budgetTable;
        }
        if (token === CATEGORY_BUDGET_DB_TOKEN) {
          return categoryBudgetTable;
        }
        if (token === TRANSACTION_DB_TOKEN) {
          return transactionTable;
        }
        throw new Error(`Unexpected table token: ${token}`);
      }),
    } as unknown as LocalDbService;
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should seed previous month category budgets, overall budget, and transactions on first run', async () => {
    const refDate = new Date(2026, 10, 8, 12, 0, 0); // Nov 8, 2026 -> previous month is Oct 2026 (month index 9)

    await seedPreviousMonthBudgetIfNeeded(mockLocalDbService, refDate);

    expect(categoryBudgets.length).toBeGreaterThan(0);
    expect(budgets).toHaveLength(1);
    expect(budgets[0].amount).toBe(categoryBudgets.reduce((sum, item) => sum + item.amount, 0));
    expect(transactions.length).toBeGreaterThan(0);

    for (const tx of transactions) {
      const d = new Date(tx.date);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(9);
    }

    expect(localStorage.getItem(PREV_MONTH_BUDGET_SEED_STORAGE_KEY)).toBe('true');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-11
  it('should not seed again when the localStorage flag is already set', async () => {
    localStorage.setItem(PREV_MONTH_BUDGET_SEED_STORAGE_KEY, 'true');

    await seedPreviousMonthBudgetIfNeeded(mockLocalDbService, new Date(2026, 10, 8));

    expect(mockLocalDbService.getTable).not.toHaveBeenCalled();
    expect(categoryBudgets).toHaveLength(0);
    expect(transactions).toHaveLength(0);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge-Case-6
  it('should handle January correctly by seeding December of the previous year', async () => {
    const refDate = new Date(2026, 0, 15, 12, 0, 0); // Jan 15, 2026 -> Dec 2025

    await seedPreviousMonthBudgetIfNeeded(mockLocalDbService, refDate);

    expect(transactions.length).toBeGreaterThan(0);
    for (const tx of transactions) {
      const d = new Date(tx.date);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(11);
    }
  });
});
