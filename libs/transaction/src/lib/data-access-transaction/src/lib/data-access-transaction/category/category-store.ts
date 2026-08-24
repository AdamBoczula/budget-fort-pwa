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
}
