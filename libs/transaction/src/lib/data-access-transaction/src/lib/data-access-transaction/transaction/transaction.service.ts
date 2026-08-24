import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Transaction } from '../model/transaction.type';
import { TransactionStore } from './transaction-store';

/**
 * This service is a facade to call
 *  - transaction-store (to manipulate data in the indexed db)
 *  - transaction-api (to manipulate data in the backend)  *this will be added post MVP
 *
 */
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly transactionStore = inject(TransactionStore);
  private readonly transactionsState = signal<Transaction[]>([]);

  public readonly transactions = this.transactionsState.asReadonly();
  public readonly transactionsCount = computed(
    () => this.transactionsState().length,
  );

  public getTransactions(): Observable<Transaction[]> {
    return this.transactionStore
      .getTransactions()
      .pipe(tap((transactions) => this.transactionsState.set(transactions)));
  }

  public async getTransactionsAsync(): Promise<Transaction[]> {
    const transactions = await this.transactionStore.getTransactionsAsync();
    this.transactionsState.set(transactions);
    return transactions;
  }

  public setTransactions(
    transactions: Transaction[],
  ): Observable<Transaction[]> {
    return this.transactionStore
      .setTransactions(transactions)
      .pipe(
        tap((persistedTransactions) =>
          this.transactionsState.set(persistedTransactions),
        ),
      );
  }

  public deleteTransaction(id: string): Observable<void> {
    return this.transactionStore.deleteTransaction(id).pipe(
      tap(() => {
        this.transactionsState.update((transactions) =>
          transactions.filter((t) => t.id !== id),
        );
      }),
    );
  }

  public async deleteTransactionAsync(id: string): Promise<void> {
    await this.transactionStore.deleteTransactionAsync(id);
    this.transactionsState.update((transactions) =>
      transactions.filter((t) => t.id !== id),
    );
  }

  public addTransaction(transaction: Transaction): Observable<Transaction> {
    return this.transactionStore.addTransaction(transaction).pipe(
      tap((savedTransaction) => {
        this.transactionsState.update((transactions) => [
          ...transactions,
          savedTransaction,
        ]);
      }),
    );
  }

  public async addTransactionAsync(transaction: Transaction): Promise<Transaction> {
    const saved = await this.transactionStore.addTransactionAsync(transaction);
    this.transactionsState.update((transactions) => [
      ...transactions,
      saved,
    ]);
    return saved;
  }

  public editTransaction(transaction: Transaction): Observable<Transaction> {
    return this.transactionStore.updateTransaction(transaction).pipe(
      tap((updatedTransaction) => {
        this.transactionsState.update((transactions) =>
          transactions.map((currentTransaction) =>
            currentTransaction.id === updatedTransaction.id
              ? updatedTransaction
              : currentTransaction,
          ),
        );
      }),
    );
  }

  public async editTransactionAsync(transaction: Transaction): Promise<Transaction> {
    const updated = await this.transactionStore.updateTransactionAsync(transaction);
    this.transactionsState.update((transactions) =>
      transactions.map((currentTransaction) =>
        currentTransaction.id === updated.id
          ? updated
          : currentTransaction,
      ),
    );
    return updated;
  }
}
