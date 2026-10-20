import { computed, inject, Injectable, LOCALE_ID, resource, signal } from '@angular/core';
import {
  Category,
  CategoryService,
  Transaction,
} from '@data-access-transaction';
import { TransactionState } from '../transaction-state/transaction-state';
import {
  getCurrentLocalMonth,
  getMonthRange,
  getYearRange,
  getAvailableYears,
  isInMonth,
  isInYear,
} from '../dashboard-utils/period-utils';
import { roundHalfUp, calculatePercentage } from '../dashboard-utils/money-utils';

export type PeriodMode = 'month' | 'year';

export type CategorySpending = {
  categoryId: string;
  categoryName: string;
  colorHex: string;
  icon: string;
  totalAmount: number;
  percentage: number;
  transactions: Transaction[];
};

export type SubcategorySpending = {
  name: string;
  totalAmount: number;
  transactions: Transaction[];
};

export type CategoryWithSubcategories = CategorySpending & {
  subcategories: SubcategorySpending[];
};

@Injectable({ providedIn: 'root' })
export class DashboardState {
  private readonly transactionState = inject(TransactionState);
  private readonly categoryService = inject(CategoryService);
  private readonly localeId = inject(LOCALE_ID);

  readonly periodMode = signal<PeriodMode>('month');
  readonly selectedYear = signal<number>(getCurrentLocalMonth().year);
  readonly selectedMonth = signal<number>(getCurrentLocalMonth().month);

  private readonly categoriesResource = resource({
    loader: async () => this.categoryService.getCategoriesAsync(),
  });

  readonly categories = computed(() => this.categoriesResource.value() ?? []);

  readonly expenseCategories = computed(() =>
    this.categories().filter(
      (cat) => !cat.isHidden && (cat.transactionType ?? 'expense') === 'expense',
    ),
  );

  readonly allTransactions = computed(() =>
    this.transactionState.transactions(),
  );

  readonly filteredTransactions = computed(() => {
    const txns = this.allTransactions();
    const year = this.selectedYear();
    const mode = this.periodMode();

    if (mode === 'year') {
      return txns.filter((tx) => isInYear(tx.date, year));
    }

    const month = this.selectedMonth();
    return txns.filter((tx) => isInMonth(tx.date, year, month));
  });

  readonly expenseTransactions = computed(() =>
    this.filteredTransactions().filter((tx) => tx.amount < 0),
  );

  readonly totalSpending = computed(() => {
    const expenses = this.expenseTransactions();
    if (expenses.length === 0) {return 0;}
    return roundHalfUp(
      expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      2,
    );
  });

  readonly categorySpending = computed<CategorySpending[]>(() => {
    const categories = this.expenseCategories();
    const transactions = this.expenseTransactions();
    const total = this.totalSpending();

    const categoryMap = new Map<string, { cat: Category; txns: Transaction[] }>();

    for (const cat of categories) {
      categoryMap.set(cat.id, { cat, txns: [] });
    }

    for (const tx of transactions) {
      const entry = categoryMap.get(tx.categoryId);
      if (entry) {
        entry.txns.push(tx);
      }
    }

    const result: CategorySpending[] = [];

    for (const [, entry] of categoryMap) {
      const totalAmount = roundHalfUp(
        entry.txns.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        2,
      );

      if (totalAmount === 0) {continue;}

      result.push({
        categoryId: entry.cat.id,
        categoryName: entry.cat.name,
        colorHex: entry.cat.colorHex,
        icon: entry.cat.icon,
        totalAmount,
        percentage: calculatePercentage(totalAmount, total),
        transactions: entry.txns.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      });
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  });
readonly totalIncome = computed(() => {
    const incomes = this.filteredTransactions().filter((tx) => tx.amount > 0);
    if (incomes.length === 0) {return 0;}
    return roundHalfUp(
      incomes.reduce((sum, tx) => sum + tx.amount, 0),
      2,
    );
  });

  readonly categoryWithSubcategories = computed<CategoryWithSubcategories[]>(() => {
    return this.categorySpending().map((cat) => {
      const subMap = new Map<string, Transaction[]>();

      for (const tx of cat.transactions) {
        const subName = tx.subcategory?.trim() || '(bez podkategorii)';
        const existing = subMap.get(subName) ?? [];
        existing.push(tx);
        subMap.set(subName, existing);
      }

      const subcategories: SubcategorySpending[] = [];
      for (const [name, txns] of subMap) {
        subcategories.push({
          name,
          totalAmount: roundHalfUp(
            txns.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
            2,
          ),
          transactions: txns.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        });
      }

      return {
        ...cat,
        subcategories: subcategories.sort((a, b) => b.totalAmount - a.totalAmount),
      };
    });
  });

  readonly periodLabel = computed(() => {
    const year = this.selectedYear();
    if (this.periodMode() === 'year') {
      return `${year}`;
    }
    const monthName = new Date(year, this.selectedMonth()).toLocaleDateString(
      this.localeId,
      { month: 'long' },
    );
    return `${monthName} ${year}`;
  });

  readonly availableYears = computed(() => {
    const dates = this.allTransactions().map((tx) => tx.date);
    const years = getAvailableYears(dates);
    const currentYear = getCurrentLocalMonth().year;
    if (!years.includes(currentYear)) {
      years.push(currentYear);
      years.sort((a, b) => b - a);
    }
    return years;
  });

  readonly transactionCount = computed(() => this.filteredTransactions().length);

  setPeriodMode(mode: PeriodMode): void {
    this.periodMode.set(mode);
  }

  setYear(year: number): void {
    this.selectedYear.set(year);
  }

  setMonth(month: number): void {
    this.selectedMonth.set(month);
  }

  goToPrevious(): void {
    if (this.periodMode() === 'year') {
      this.selectedYear.update((y) => y - 1);
    } else {
      const currentMonth = this.selectedMonth();
      const currentYear = this.selectedYear();
      if (currentMonth === 0) {
        this.selectedMonth.set(11);
        this.selectedYear.set(currentYear - 1);
      } else {
        this.selectedMonth.set(currentMonth - 1);
      }
    }
  }

  goToNext(): void {
    const now = getCurrentLocalMonth();
    if (this.periodMode() === 'year') {
      const nextYear = this.selectedYear() + 1;
      if (nextYear <= now.year) {
        this.selectedYear.set(nextYear);
      }
    } else {
      const currentMonth = this.selectedMonth();
      const currentYear = this.selectedYear();
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      if (nextYear < now.year || (nextYear === now.year && nextMonth <= now.month)) {
        this.selectedMonth.set(nextMonth);
        this.selectedYear.set(nextYear);
      }
    }
  }

  readonly canGoNext = computed(() => {
    const now = getCurrentLocalMonth();
    if (this.periodMode() === 'year') {
      return this.selectedYear() < now.year;
    }
    const y = this.selectedYear();
    const m = this.selectedMonth();
    return y < now.year || (y === now.year && m < now.month);
  });

  readonly canGoPrevious = computed(() => {
    if (this.periodMode() === 'year') {
      return this.selectedYear() > 2020;
    }
    return true;
  });
}