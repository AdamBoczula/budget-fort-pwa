// spec: docs/specs/budget/planowanie-budzetu.md

import { inject, Service } from '@angular/core';
import { CATEGORY_BUDGET_DB_TOKEN, LocalDbService } from 'local-db';
import type { CategoryBudget } from '../model/category-budget.type';

@Service()
export class CategoryBudgetService {
  private readonly localDbService = inject(LocalDbService);

  private get categoryBudgetTable() {
    return this.localDbService.getTable<CategoryBudget, number>(CATEGORY_BUDGET_DB_TOKEN);
  }

  public async getAll(): Promise<CategoryBudget[]> {
    return this.categoryBudgetTable.toArray();
  }

  public async save(categoryId: string, categoryName: string, amount: number): Promise<void> {
    const now = new Date().toISOString();

    const existing = await this.categoryBudgetTable.where('categoryId').equals(categoryId).first();

    if (existing) {
      await this.categoryBudgetTable.put({
        ...existing,
        categoryName,
        amount,
        updatedAt: now,
      });
    } else {
      await this.categoryBudgetTable.put({
        categoryId,
        categoryName,
        amount,
        updatedAt: now,
      });
    }
  }

  public async delete(id: number): Promise<void> {
    await this.categoryBudgetTable.delete(id);
  }

  public async deleteByCategoryId(categoryId: string): Promise<void> {
    const existing = await this.categoryBudgetTable.where('categoryId').equals(categoryId).first();

    if (existing?.id !== undefined) {
      await this.categoryBudgetTable.delete(existing.id);
    }
  }
}
