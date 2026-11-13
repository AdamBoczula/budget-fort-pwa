import { inject, Injectable } from '@angular/core';
import { SyncQueueService } from '@data-access-sync';
import { LocalDbService, TRANSACTION_DB_TOKEN } from 'local-db';
import { defer, Observable } from 'rxjs';
import { Transaction } from '../model/transaction.type';

/**
 * This service only manipulate IndexedDB data.
 *
 */
@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private readonly localDbService = inject(LocalDbService);
  private readonly syncQueue = inject(SyncQueueService, { optional: true });

  private get transactionsTable() {
    return this.localDbService.getTable<Transaction, string>(TRANSACTION_DB_TOKEN);
  }

  public getTransactions(): Observable<Transaction[]> {
    return defer(() => this.transactionsTable.toArray());
  }

  public async getTransactionsAsync(): Promise<Transaction[]> {
    return this.transactionsTable.toArray();
  }

  public setTransactions(transactions: Transaction[]): Observable<Transaction[]> {
    return defer(async () => {
      const database = this.localDbService.getDatabase();

      await database.transaction('rw', this.transactionsTable, async () => {
        await this.transactionsTable.clear();

        if (transactions.length > 0) {
          await this.transactionsTable.bulkPut(transactions);
        }
      });

      return transactions;
    });
  }

  public deleteTransaction(id: string): Observable<void> {
    return defer(async () => {
      await this.deleteTransactionAsync(id);
    });
  }

  public async deleteTransactionAsync(id: string): Promise<void> {
    await this.transactionsTable.delete(id);
    await this.syncQueue?.enqueue('transaction', id, 'delete', null);
  }

  public addTransaction(transactionData: Transaction): Observable<Transaction> {
    return defer(async () => {
      return this.addTransactionAsync(transactionData);
    });
  }

  public async addTransactionAsync(transactionData: Transaction): Promise<Transaction> {
    transactionData.updatedAt = transactionData.updatedAt ?? new Date().toISOString();
    await this.transactionsTable.add(transactionData);
    await this.syncQueue?.enqueue(
      'transaction',
      transactionData.id,
      'upsert',
      transactionData as unknown as Record<string, unknown>,
    );
    return transactionData;
  }

  public updateTransaction(transactionData: Transaction): Observable<Transaction> {
    return defer(async () => {
      return this.updateTransactionAsync(transactionData);
    });
  }

  public async updateTransactionAsync(transactionData: Transaction): Promise<Transaction> {
    transactionData.updatedAt = transactionData.updatedAt ?? new Date().toISOString();
    await this.transactionsTable.put(transactionData);
    await this.syncQueue?.enqueue(
      'transaction',
      transactionData.id,
      'upsert',
      transactionData as unknown as Record<string, unknown>,
    );
    return transactionData;
  }
}
