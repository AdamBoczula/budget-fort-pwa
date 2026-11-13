// spec: docs/specs/sync/01-firestore-sync.md

import { inject, Service } from '@angular/core';
import { SyncQueueService } from '@data-access-sync';
import { BUDGET_DB_TOKEN, LocalDbService } from 'local-db';
import type { Budget } from '../model/budget.type';

const BUDGET_SINGLETON_ID = 1;

@Service()
export class BudgetService {
  private readonly localDbService = inject(LocalDbService);
  private readonly syncQueue = inject(SyncQueueService, { optional: true });

  private get budgetTable() {
    return this.localDbService.getTable<Budget, number | string>(BUDGET_DB_TOKEN);
  }

  public async getBudget(): Promise<Budget | undefined> {
    return this.budgetTable.get(BUDGET_SINGLETON_ID);
  }

  public async saveBudget(amount: number): Promise<void> {
    const now = new Date().toISOString();
    const budget: Budget = {
      id: BUDGET_SINGLETON_ID,
      amount,
      updatedAt: now,
    };
    await this.budgetTable.put(budget);
    await this.syncQueue?.enqueue(
      'budget',
      String(BUDGET_SINGLETON_ID),
      'upsert',
      budget as unknown as Record<string, unknown>,
    );
  }
}
