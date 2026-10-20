// spec: docs/specs/budget/planowanie-budzetu.md

import { computed, inject, resource, Service, signal } from '@angular/core';
import { BudgetService, CategoryBudgetService } from '@data-access-budget';
import type { Budget } from '@data-access-budget';
import type { CategoryBudget } from '@data-access-budget';
import { TransactionService } from '@data-access-transaction';
import type { Transaction } from '@data-access-transaction';

export type BudgetProgress = {
  spent: number;
  limit: number;
  percentage: number;
};

export type CategoryBudgetProgress = {
  categoryId: string;
  categoryName: string;
  spent: number;
  limit: number;
  percentage: number;
};

/** Get current year and month in local timezone (Europe/Warsaw). */
function getCurrentLocalMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Check whether a date ISO string belongs to the given month. */
function isInCurrentMonth(dateString: string, year: number, month: number): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }
  return date.getFullYear() === year && date.getMonth() === month;
}

@Service()
export class BudgetState {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryBudgetService = inject(CategoryBudgetService);
  private readonly transactionService = inject(TransactionService);

  /** Version signal to trigger budget reloads. */
  private readonly dataVersion = signal(0);

  /** Transactions resource — lazy loaded from IndexedDB. */
  private readonly transactionsResource = resource<Transaction[], number>({
    params: () => this.dataVersion(),
    loader: async () => this.transactionService.getTransactionsAsync(),
  });

  /** Budget resource — lazy loaded from IndexedDB. */
  private readonly budgetResource = resource<Budget | undefined, number>({
    params: () => this.dataVersion(),
    loader: async () => this.budgetService.getBudget(),
  });

  /** Category budgets resource — lazy loaded from IndexedDB. */
  private readonly categoryBudgetsResource = resource<CategoryBudget[], number>({
    params: () => this.dataVersion(),
    loader: async () => this.categoryBudgetService.getAll(),
  });

  /** All transactions. */
  private readonly allTransactions = computed<Transaction[]>(
    () => this.transactionsResource.value() ?? [],
  );

  /** Expense transactions in the current month. */
  private readonly currentMonthExpenses = computed<Transaction[]>(() => {
    const { year, month } = getCurrentLocalMonth();
    return this.allTransactions().filter(
      (tx) => tx.amount < 0 && isInCurrentMonth(tx.date, year, month),
    );
  });

  /** Overall budget progress. */
  readonly overallProgress = computed<BudgetProgress>(() => {
    const budget = this.budgetResource.value();
    const limit = budget?.amount ?? 0;
    const spent = this.currentMonthExpenses().reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const percentage = limit > 0 ? this.clampPercentage(spent, limit) : 0;
    return { spent, limit, percentage };
  });

  /** Per-category budget progress. Only categories with a limit > 0 are included. */
  readonly categoryProgresses = computed<CategoryBudgetProgress[]>(() => {
    const categoryBudgets = this.categoryBudgetsResource.value() ?? [];
    const expenses = this.currentMonthExpenses();

    const result: CategoryBudgetProgress[] = [];

    for (const cb of categoryBudgets) {
      if (cb.amount <= 0) {
        continue;
      }

      const spent = expenses
        .filter((tx) => tx.categoryId === String(cb.categoryId))
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      result.push({
        categoryId: String(cb.categoryId),
        categoryName: cb.categoryName,
        spent,
        limit: cb.amount,
        percentage: this.clampPercentage(spent, cb.amount),
      });
    }

    return result;
  });

  /** Loading state. */
  readonly loading = computed(
    () =>
      this.transactionsResource.status() === 'loading' ||
      this.transactionsResource.status() === 'reloading' ||
      this.budgetResource.status() === 'loading' ||
      this.categoryBudgetsResource.status() === 'loading',
  );

  /** Error state. */
  readonly error = computed<string | null>(() => {
    if (this.transactionsResource.error()) {
      return 'Failed to load transactions.';
    }
    if (this.budgetResource.error()) {
      return 'Failed to load budget.';
    }
    if (this.categoryBudgetsResource.error()) {
      return 'Failed to load category budgets.';
    }
    return null;
  });

  /** Triggers a reload of all data from IndexedDB. */
  public reload(): void {
    this.dataVersion.update((v) => v + 1);
  }

  private clampPercentage(spent: number, limit: number): number {
    if (limit <= 0) {
      return 0;
    }
    const pct = Math.round((spent / limit) * 100);
    return Math.max(0, Math.min(100, pct));
  }
}
