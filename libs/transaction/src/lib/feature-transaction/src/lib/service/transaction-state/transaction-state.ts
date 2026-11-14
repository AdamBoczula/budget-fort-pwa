import { computed, inject, Injectable, LOCALE_ID, resource, signal } from '@angular/core';
import {
  RecurringRuleService,
  RecurringTransactionRule,
  Transaction,
  TransactionService,
} from '@data-access-transaction';

type TransactionGroup = {
  label: string;
  transactions: Transaction[];
};

@Injectable({ providedIn: 'root' })
export class TransactionState {
  private readonly transactionService = inject(TransactionService);
  private readonly recurringRuleService = inject(RecurringRuleService, { optional: true });
  private readonly localeId = inject(LOCALE_ID);

  /**
   * Sygnał-wersja: każda mutacja (add/delete/edit) inkrementuje tę wartość,
   * co powoduje automatyczne przeładowanie `transactionsResource`.
   */
  private readonly dataVersion = signal(0);

  /** Komunikat błędu ostatniej operacji mutacji (add/delete/edit). */
  public readonly mutationError = signal<string | null>(null);

  /**
   * Główne źródło danych – `resource()` ładuje transakcje przy starcie
   * i automatycznie przeładowuje gdy zmieni się `dataVersion`.
   */
  readonly transactionsResource = resource({
    params: () => this.dataVersion(),
    loader: async () => {
      return this.transactionService.getTransactionsAsync();
    },
  });

  /** Backward-compat computed: lista transakcji (pusta przed załadowaniem). */
  public readonly transactions = computed(() => this.transactionsResource.value() ?? []);

  /** Backward-compat computed: stan ładowania. */
  public readonly loading = computed(() =>
    ['loading', 'reloading'].includes(this.transactionsResource.status()),
  );

  /** Backward-compat computed: czy dane zostały kiedykolwiek załadowane. */
  public readonly initialized = computed(
    () =>
      this.transactionsResource.status() === 'resolved' ||
      this.transactionsResource.status() === 'error' ||
      this.transactionsResource.status() === 'reloading',
  );

  /** Backward-compat computed: komunikat błędu. */
  public readonly error = computed<string | null>(() => {
    const err = this.transactionsResource.error();
    if (!err) {
      return null;
    }
    return this.translate('Nie udalo sie zaladowac transakcji.');
  });

  public readonly transactionsCount = computed(
    () => (this.transactionsResource.value() ?? []).length,
  );

  public readonly balance = computed(() =>
    (this.transactionsResource.value() ?? []).reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
  );

  public readonly groupedTransactions = computed<TransactionGroup[]>(() => {
    const sorted = [...this.transactions()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const grouped = new Map<string, Transaction[]>();

    for (const transaction of sorted) {
      const date = new Date(transaction.date);
      const key = this.dayKey(date);
      const existing = grouped.get(key) ?? [];
      existing.push(transaction);
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).map(([key, transactions]) => ({
      label: this.dayLabelFromKey(key),
      transactions,
    }));
  });

  public async deleteTransaction(id: string): Promise<void> {
    try {
      this.mutationError.set(null);
      await this.transactionService.deleteTransactionAsync(id);
      this.dataVersion.update((v) => v + 1);
    } catch {
      this.mutationError.set(this.translate('Nie udalo sie usunac transakcji.'));
    }
  }

  public async addTransaction(
    transaction: Transaction,
    recurringOptions?: { isRecurring: boolean; dayOfMonth?: number },
  ): Promise<void> {
    try {
      this.mutationError.set(null);
      if (recurringOptions?.isRecurring && this.recurringRuleService) {
        const ruleId = crypto.randomUUID();
        const day = recurringOptions.dayOfMonth ?? 1;
        const currentMonth = transaction.date.slice(0, 7);
        const rule: RecurringTransactionRule = {
          id: ruleId,
          amount: Math.abs(transaction.amount),
          categoryId: transaction.categoryId,
          accountId: transaction.accountId,
          subcategory: transaction.subcategory,
          comment: transaction.comment,
          dayOfMonth: day,
          startDate: transaction.date.slice(0, 10),
          lastGeneratedMonth: currentMonth,
          isActive: true,
          updatedAt: new Date().toISOString(),
        };
        await this.recurringRuleService.addRuleAsync(rule);
        transaction.recurringRuleId = ruleId;
      }
      await this.transactionService.addTransactionAsync(transaction);
      this.dataVersion.update((v) => v + 1);
    } catch {
      this.mutationError.set(this.translate('Nie udalo sie zapisac transakcji.'));
    }
  }

  public async editTransaction(transaction: Transaction): Promise<void> {
    try {
      this.mutationError.set(null);
      await this.transactionService.editTransactionAsync(transaction);
      this.dataVersion.update((v) => v + 1);
    } catch {
      this.mutationError.set(this.translate('Nie udalo sie zaktualizowac transakcji.'));
    }
  }

  private dayKey(date: Date): string {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  }

  private dayLabelFromKey(key: string): string {
    const date = new Date(key);
    const today = this.startOfDay(new Date());
    const day = this.startOfDay(date);
    const diffMs = today.getTime() - day.getTime();
    const dayDiff = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (dayDiff === 0) {
      return this.translate('Dzisiaj');
    }

    if (dayDiff === 1) {
      return this.translate('Wczoraj');
    }

    return date.toLocaleDateString(this.localeId);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private translate(polish: string): string {
    if (!this.localeId.startsWith('en')) {
      return polish;
    }

    switch (polish) {
      case 'Nie udalo sie usunac transakcji.':
        return 'Failed to delete transaction.';
      case 'Nie udalo sie zaladowac transakcji.':
        return 'Failed to load transactions.';
      case 'Nie udalo sie zapisac transakcji.':
        return 'Failed to save transaction.';
      case 'Nie udalo sie zaktualizowac transakcji.':
        return 'Failed to update transaction.';
      case 'Dzisiaj':
        return 'Today';
      case 'Wczoraj':
        return 'Yesterday';
      default:
        return polish;
    }
  }
}
