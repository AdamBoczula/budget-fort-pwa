// spec: docs/specs/sync/01-firestore-sync.md

import { inject, Service } from '@angular/core';
import { SyncQueueService } from '@data-access-sync';
import { CATEGORY_BUDGET_DB_TOKEN, LocalDbService } from 'local-db';
import type { CategoryBudget } from '../model/category-budget.type';

@Service()
export class CategoryBudgetService {
  private readonly localDbService = inject(LocalDbService);
  private readonly syncQueue = inject(SyncQueueService, { optional: true });

  private get categoryBudgetTable() {
    return this.localDbService.getTable<CategoryBudget, number | string>(CATEGORY_BUDGET_DB_TOKEN);
  }

  public async getAll(): Promise<CategoryBudget[]> {
    return this.categoryBudgetTable.toArray();
  }

  public async save(categoryId: string, categoryName: string, amount: number): Promise<void> {
    const existing = await this.categoryBudgetTable.where('categoryId').equals(categoryId).first();

    if (existing) {
      await this.updateExistingCategoryBudget(existing, categoryName, amount);
    } else {
      await this.createNewCategoryBudget(categoryId, categoryName, amount);
    }
  }

  private async updateExistingCategoryBudget(
    existing: CategoryBudget,
    categoryName: string,
    amount: number,
  ): Promise<void> {
    const record: CategoryBudget = {
      ...existing,
      categoryName,
      amount,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
    await this.categoryBudgetTable.put(record);
    await this.syncQueue?.enqueue(
      'categoryBudget',
      String(record.id),
      'upsert',
      record as unknown as Record<string, unknown>,
    );
  }

  private async createNewCategoryBudget(
    categoryId: string,
    categoryName: string,
    amount: number,
  ): Promise<void> {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cb_${Date.now()}_${categoryId}`;
    const record: CategoryBudget = {
      id,
      categoryId,
      categoryName,
      amount,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
    await this.categoryBudgetTable.put(record);
    await this.syncQueue?.enqueue(
      'categoryBudget',
      String(id),
      'upsert',
      record as unknown as Record<string, unknown>,
    );
  }

  public async delete(id: number | string): Promise<void> {
    await this.categoryBudgetTable.delete(id);
    await this.syncQueue?.enqueue('categoryBudget', String(id), 'delete', null);
  }

  public async deleteByCategoryId(categoryId: string): Promise<void> {
    const existing = await this.categoryBudgetTable.where('categoryId').equals(categoryId).first();

    if (existing?.id !== undefined) {
      await this.categoryBudgetTable.delete(existing.id);
      await this.syncQueue?.enqueue('categoryBudget', String(existing.id), 'delete', null);
    }
  }
}
