// spec: docs/specs/budget/planowanie-budzetu.md

import { computed, Service, signal } from '@angular/core';
import type { Transaction, Category } from '@data-access-transaction';
import { getPreviousMonth, isInMonth } from '@ui-budget';
import type { CategoryBudget } from '@data-access-budget';

export type CategorySpendingSummary = {
  categoryId: string;
  categoryName: string;
  spent: number;
  spentFormatted: string;
  limit: number;
  limitFormatted: string;
  isOverLimit: boolean;
};

export type PreviousMonthSummary = {
  monthLabel: string;
  totalSpent: number;
  totalSpentFormatted: string;
  budgetLimit: number;
  budgetLimitFormatted: string;
  categorySummaries: ReadonlyArray<CategorySpendingSummary>;
};

export type MonthComparison = {
  diff: number;
  pct: number;
  isMore: boolean;
};

/** Reads from the provided signals and computes all budget aggregations. */
@Service()
export class BudgetAggregationService {
  // ── Inputs (set by the container) ──

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly categoryBudgets = signal<CategoryBudget[]>([]);
  readonly formVersion = signal(0);
  readonly currentMonthSpent = signal(0);

  /**
   * Call this from the container when the form changes so that
   * the form-based computed signals pick up the new values.
   */
  bumpFormVersion(): void {
    this.formVersion.update((v) => v + 1);
  }

  // ── Derived values ──

  /** Retrieves form values — must be set externally by the container. */
  private _formValueFn: (() => Record<string, number | null>) | null = null;
  setFormValueFn(fn: () => Record<string, number | null>): void {
    this._formValueFn = fn;
  }

  private getFormValues(): Record<string, number | null> {
    return this._formValueFn?.() ?? {};
  }

  /** Overall budget = sum of all category limits from the form. */
  readonly overallBudget = computed(() => {
    void this.formVersion();
    const values = this.getFormValues();
    let sum = 0;
    for (const amount of Object.values(values)) {
      if (amount !== null && amount > 0) {
        sum += amount;
      }
    }
    return sum;
  });

  /** Progress percentage for current month. */
  readonly currentMonthPercentage = computed(() => {
    const budget = this.overallBudget();
    const spent = this.currentMonthSpent();
    if (budget <= 0) {return 0;}
    return Math.min(100, Math.round((spent / budget) * 100));
  });

  /** Real previous month summary. */
  readonly previousMonthSummary = computed<PreviousMonthSummary | null>(() => {
    void this.formVersion();
    const categories = this.categories();
    const txs = this.transactions();
    if (categories.length === 0) {return null;}

    const prevDate = getPreviousMonth();
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const monthLabel = prevDate.toLocaleString('pl-PL', {
      month: 'long',
      year: 'numeric',
    });

    const prevMonthExpenses = txs.filter(
      (tx) => tx.amount < 0 && isInMonth(tx.date, prevYear, prevMonth),
    );

    const budgets = this.categoryBudgets();
    const budgetByCategory: Record<string, number> = {};
    for (const cb of budgets) {
      budgetByCategory[String(cb.categoryId)] = cb.amount;
    }
    // Augment with current form values (for categories not yet saved)
    const formValues = this.getFormValues();
    for (const [catId, amount] of Object.entries(formValues)) {
      if (amount !== null && amount > 0 && !(catId in budgetByCategory)) {
        budgetByCategory[catId] = amount;
      }
    }

    const categorySummaries: CategorySpendingSummary[] = categories.map((cat) => {
      const spent = prevMonthExpenses
        .filter((tx) => tx.categoryId === cat.id)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
      const limit = budgetByCategory[cat.id] ?? 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        spent,
        spentFormatted: `${spent.toFixed(0)} zł`,
        limit,
        limitFormatted: `${limit.toFixed(0)} zł`,
        isOverLimit: limit > 0 && spent > limit,
      };
    });

    const totalSpent = categorySummaries.reduce((s, c) => s + c.spent, 0);
    const budgetLimit = Object.values(budgetByCategory).reduce((s, v) => s + v, 0);

    return {
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      totalSpent,
      totalSpentFormatted: `${totalSpent.toFixed(0)} zł`,
      budgetLimit,
      budgetLimitFormatted: `${budgetLimit.toFixed(0)} zł`,
      categorySummaries,
    };
  });

  /** O(1) lookup for previous month category spending. */
  readonly categorySpendingMap = computed(() => {
    const map = new Map<string, CategorySpendingSummary>();
    for (const c of this.previousMonthSummary()?.categorySummaries ?? []) {
      map.set(c.categoryId, c);
    }
    return map;
  });

  /** Month-over-month comparison. */
  readonly monthComparison = computed<MonthComparison | null>(() => {
    const prev = this.previousMonthSummary();
    const current = this.currentMonthSpent();
    if (!prev || prev.totalSpent === 0) {return null;}
    const diff = current - prev.totalSpent;
    const pct = Math.round((diff / prev.totalSpent) * 100);
    return { diff, pct, isMore: pct > 0 };
  });
}
