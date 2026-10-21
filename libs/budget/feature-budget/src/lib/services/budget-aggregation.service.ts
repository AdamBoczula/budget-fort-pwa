// spec: docs/specs/budget/przeglad-historii-budzetu.md

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

export type SelectedPeriod = {
  year: number;
  month: number;
  mode: 'month' | 'year';
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

  /** The selected period — defaults to current month. */
  readonly selectedPeriod = signal<SelectedPeriod>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    mode: 'month',
  });

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

  /** Progress percentage for selected period. */
  readonly selectedPeriodPercentage = computed(() => {
    const budget = this.overallBudget();
    const spent = this.currentMonthSpent();
    if (budget <= 0) {return 0;}
    return Math.min(100, Math.round((spent / budget) * 100));
  });

  /**
   * Get the previous period relative to the selected period.
   * For 'month' mode: returns the month before selectedPeriod.
   * For 'year' mode: returns the year before.
   */
  private getPreviousPeriod(year: number, month: number, mode: 'month' | 'year'): { year: number; month: number } {
    if (mode === 'year') {
      return { year: year - 1, month: 0 };
    }

    if (month === 0) {
      return { year: year - 1, month: 11 };
    }

    return { year, month: month - 1 };
  }

  /** Get the label for a given month. */
  private getMonthLabel(year: number, month: number, mode: 'month' | 'year'): string {
    if (mode === 'year') {
      return `${year}`;
    }

    const date = new Date(year, month, 1);
    const label = date.toLocaleString('pl-PL', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  /** Filter transactions for a specific period. */
  private filterTransactions(txs: Transaction[], year: number, month: number, mode: 'month' | 'year'): Transaction[] {
    if (mode === 'year') {
      return txs.filter((tx) => {
        const d = new Date(tx.date);
        return tx.amount < 0 && d.getFullYear() === year;
      });
    }

    return txs.filter((tx) => tx.amount < 0 && isInMonth(tx.date, year, month));
  }

  /** Build a PreviousMonthSummary for a given period. */
  private buildSummary(year: number, month: number, mode: 'month' | 'year'): PreviousMonthSummary | null {
    const categories = this.categories();
    if (categories.length === 0) {return null;}

    const txs = this.transactions();
    const periodExpenses = this.filterTransactions(txs, year, month, mode);

    const monthLabel = this.getMonthLabel(year, month, mode);

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
      const spent = periodExpenses
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
      monthLabel,
      totalSpent,
      totalSpentFormatted: `${totalSpent.toFixed(0)} zł`,
      budgetLimit,
      budgetLimitFormatted: `${budgetLimit.toFixed(0)} zł`,
      categorySummaries,
    };
  }

  /** Real previous month summary (backward-compatible — always current month's previous). */
  readonly previousMonthSummary = computed<PreviousMonthSummary | null>(() => {
    void this.formVersion();
    const prevDate = getPreviousMonth();
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    return this.buildSummary(prevYear, prevMonth, 'month');
  });

  /** Summary for the period before the selected period. */
  readonly selectedPreviousPeriodSummary = computed<PreviousMonthSummary | null>(() => {
    void this.formVersion();
    const period = this.selectedPeriod();
    const prev = this.getPreviousPeriod(period.year, period.month, period.mode);
    return this.buildSummary(prev.year, prev.month, period.mode);
  });

  /** O(1) lookup for previous month category spending. */
  readonly categorySpendingMap = computed(() => {
    const map = new Map<string, CategorySpendingSummary>();
    for (const c of this.previousMonthSummary()?.categorySummaries ?? []) {
      map.set(c.categoryId, c);
    }
    return map;
  });

  /** Month-over-month comparison (backward-compatible — current month vs previous). */
  readonly monthComparison = computed<MonthComparison | null>(() => {
    const prev = this.previousMonthSummary();
    const current = this.currentMonthSpent();
    if (!prev || prev.totalSpent === 0) {return null;}
    const diff = current - prev.totalSpent;
    const pct = Math.round((diff / prev.totalSpent) * 100);
    return { diff, pct, isMore: pct > 0 };
  });

  /** Comparison between selected period and the period before it. */
  readonly selectedPeriodComparison = computed<MonthComparison | null>(() => {
    const prev = this.selectedPreviousPeriodSummary();
    const current = this.currentMonthSpent();
    if (!prev || prev.totalSpent === 0) {return null;}
    const diff = current - prev.totalSpent;
    const pct = Math.round((diff / prev.totalSpent) * 100);
    return { diff, pct, isMore: pct > 0 };
  });
}