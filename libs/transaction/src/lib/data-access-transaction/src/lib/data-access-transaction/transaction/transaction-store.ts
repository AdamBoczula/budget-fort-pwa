import { inject, Injectable } from '@angular/core';
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

  private get transactionsTable() {
    return this.localDbService.getTable<Transaction, string>(
      TRANSACTION_DB_TOKEN,
    );
  }

  public getTransactions(): Observable<Transaction[]> {
    return defer(() => this.transactionsTable.toArray());
  }

  public setTransactions(
    transactions: Transaction[],
  ): Observable<Transaction[]> {
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

  public addTransaction(transactionData: Transaction): Observable<Transaction> {
    return defer(async () => {
      await this.transactionsTable.add(transactionData);
      return transactionData;
    });
  }

  public updateTransaction(
    transactionData: Transaction,
  ): Observable<Transaction> {
    return defer(async () => {
      await this.transactionsTable.put(transactionData);
      return transactionData;
    });
  }
}
