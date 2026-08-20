import { computed, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { Transaction, TransactionService } from '@data-access-transaction';
import { firstValueFrom } from 'rxjs';

type TransactionGroup = {
  label: string;
  transactions: Transaction[];
};

@Injectable({ providedIn: 'root' })
export class TransactionState {
  private readonly transactionService = inject(TransactionService);
  private readonly localeId = inject(LOCALE_ID);

  private readonly transactionsState = signal<Transaction[]>([]);
  private readonly loadingState = signal(false);
  private readonly initializedState = signal(false);
  private readonly errorState = signal<string | null>(null);

  public readonly transactions = this.transactionsState.asReadonly();
  public readonly loading = this.loadingState.asReadonly();
  public readonly initialized = this.initializedState.asReadonly();
  public readonly error = this.errorState.asReadonly();

  public readonly transactionsCount = computed(
    () => this.transactionsState().length,
  );

  public readonly balance = computed(() =>
    this.transactionsState().reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
  );

  public readonly groupedTransactions = computed<TransactionGroup[]>(() => {
    const sorted = [...this.transactionsState()].sort(
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

  public async loadTransactions(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const transactions = await firstValueFrom(
        this.transactionService.getTransactions(),
      );

      this.transactionsState.set(transactions);
      this.initializedState.set(true);
    } catch {
      this.errorState.set(
        this.translate('Nie udalo sie zaladowac transakcji.'),
      );
    } finally {
      this.loadingState.set(false);
    }
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    this.errorState.set(null);

    try {
      const savedTransaction = await firstValueFrom(
        this.transactionService.addTransaction(transaction),
      );

      this.transactionsState.update((transactions) => [
        ...transactions,
        savedTransaction,
      ]);
    } catch {
      this.errorState.set(this.translate('Nie udalo sie zapisac transakcji.'));
    }
  }

  public async editTransaction(transaction: Transaction): Promise<void> {
    this.errorState.set(null);

    try {
      const updatedTransaction = await firstValueFrom(
        this.transactionService.editTransaction(transaction),
      );

      this.transactionsState.update((transactions) =>
        transactions.map((current) =>
          current.id === updatedTransaction.id ? updatedTransaction : current,
        ),
      );
    } catch {
      this.errorState.set(
        this.translate('Nie udalo sie zaktualizowac transakcji.'),
      );
    }
  }

  private dayKey(date: Date): string {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).toISOString();
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
