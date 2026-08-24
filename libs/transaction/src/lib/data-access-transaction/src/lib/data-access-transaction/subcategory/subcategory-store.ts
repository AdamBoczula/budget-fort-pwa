import { inject, Injectable } from '@angular/core';
import { LocalDbService, SUBCATEGORY_DB_TOKEN } from 'local-db';
import { defer, Observable } from 'rxjs';
import { Subcategory } from '../model/subcategory.type';

@Injectable({ providedIn: 'root' })
export class SubcategoryStore {
  private readonly localDbService = inject(LocalDbService);

  private get subcategoriesTable() {
    return this.localDbService.getTable<Subcategory, string>(
      SUBCATEGORY_DB_TOKEN,
    );
  }

  public getSubcategories(categoryId: string): Observable<Subcategory[]> {
    return defer(() =>
      this.subcategoriesTable
        .where('categoryId')
        .equals(categoryId)
        .sortBy('name'),
    );
  }

  public async getSubcategoriesAsync(categoryId: string): Promise<Subcategory[]> {
    return this.subcategoriesTable
      .where('categoryId')
      .equals(categoryId)
      .sortBy('name');
  }

  public addSubcategory(
    subcategory: Subcategory,
  ): Observable<Subcategory> {
    return defer(async () => {
      await this.subcategoriesTable.add(subcategory);
      return subcategory;
    });
  }

  public async addSubcategoryAsync(
    subcategory: Subcategory,
  ): Promise<Subcategory> {
    await this.subcategoriesTable.add(subcategory);
    return subcategory;
  }

  public async upsertSubcategoryAsync(
    subcategory: Subcategory,
  ): Promise<Subcategory> {
    const existing = await this.subcategoriesTable
      .where({ categoryId: subcategory.categoryId, name: subcategory.name })
      .first();

    if (!existing) {
      await this.subcategoriesTable.add(subcategory);
    }

    return subcategory;
  }

  public seedSubcategoriesIfEmpty(
    subcategories: ReadonlyArray<{ categoryId: string; name: string }>,
  ): Observable<void> {
    return defer(async () => {
      const count = await this.subcategoriesTable.count();

      if (count > 0 || subcategories.length === 0) {
        return;
      }

      const now = new Date().toISOString();
      const records = subcategories.map((sub) => ({
        id: crypto.randomUUID(),
        categoryId: sub.categoryId,
        name: sub.name,
        createdAt: now,
        updatedAt: now,
      }));

      await this.subcategoriesTable.bulkPut(records);
    });
  }
}
