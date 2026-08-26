import { inject, Injectable } from '@angular/core';
import { CATEGORY_DB_TOKEN, LocalDbService } from 'local-db';
import { defer, Observable } from 'rxjs';
import { Category } from '../model/category.type';

@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private readonly localDbService = inject(LocalDbService);

  private get categoriesTable() {
    return this.localDbService.getTable<Category, string>(CATEGORY_DB_TOKEN);
  }

  public getCategories(): Observable<Category[]> {
    return defer(() => this.categoriesTable.orderBy('sortOrder').toArray());
  }

  public async getCategoriesAsync(): Promise<Category[]> {
    return this.categoriesTable.orderBy('sortOrder').toArray();
  }

  public seedCategoriesIfEmpty(
    categories: ReadonlyArray<Category>,
  ): Observable<void> {
    return defer(async () => {
      const count = await this.categoriesTable.count();

      if (count > 0 || categories.length === 0) {
        return;
      }

      await this.categoriesTable.bulkPut([...categories]);
    });
  }

  /* ---- CRUD ---- */

  /** Upsert a single category (create or full update). */
  public async updateCategoryAsync(category: Category): Promise<void> {
    await this.categoriesTable.put(category);
  }

  /** Delete a category by its primary key. */
  public async deleteCategoryAsync(id: string): Promise<void> {
    await this.categoriesTable.delete(id);
  }

  /** Add a new category. */
  public async createCategoryAsync(category: Category): Promise<void> {
    await this.categoriesTable.put(category);
  }

  /**
   * Reorder categories by bulk-updating their sortOrder values.
   * Expects the full array of categories (all visible + hidden) in the new order.
   */
  public async reorderCategoriesAsync(
    categories: Category[],
  ): Promise<void> {
    await this.categoriesTable.bulkPut(categories);
  }
}
