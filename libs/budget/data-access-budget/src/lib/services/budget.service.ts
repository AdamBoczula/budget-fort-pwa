// spec: docs/specs/budget/planowanie-budzetu.md

import { inject, Service } from '@angular/core';
import { BUDGET_DB_TOKEN, LocalDbService } from 'local-db';
import type { Budget } from '../model/budget.type';

const BUDGET_SINGLETON_ID = 1;

@Service()
export class BudgetService {
  private readonly localDbService = inject(LocalDbService);

  private get budgetTable() {
    return this.localDbService.getTable<Budget, number>(BUDGET_DB_TOKEN);
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
  }
}
