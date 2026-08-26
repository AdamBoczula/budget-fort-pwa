import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subcategory } from '../model/subcategory.type';
import { SubcategoryStore } from './subcategory-store';

@Injectable({ providedIn: 'root' })
export class SubcategoryService {
  private readonly subcategoryStore = inject(SubcategoryStore);

  public getSubcategories(categoryId: string): Observable<Subcategory[]> {
    return this.subcategoryStore.getSubcategories(categoryId);
  }

  public async getSubcategoriesAsync(categoryId: string): Promise<Subcategory[]> {
    const subcategories = await this.subcategoryStore.getSubcategoriesAsync(categoryId);
    return this.normalize(subcategories);
  }

  public async upsertSubcategoryAsync(
    categoryId: string,
    name: string,
  ): Promise<void> {
    if (!name.trim()) return;
    await this.subcategoryStore.upsertSubcategoryAsync({
      id: crypto.randomUUID(),
      categoryId,
      name: name.trim(),
    });
  }

  /* ---- CRUD ---- */

  /** Update a subcategory (e.g. rename). */
  public async updateSubcategoryAsync(subcategory: Subcategory): Promise<void> {
    await this.subcategoryStore.updateSubcategoryAsync(subcategory);
  }

  /** Delete a subcategory by its primary key. */
  public async deleteSubcategoryAsync(id: string): Promise<void> {
    await this.subcategoryStore.deleteSubcategoryAsync(id);
  }

  private normalize(subcategories: Subcategory[]): Subcategory[] {
    const seen = new Set<string>();
    return subcategories.filter((sub) => {
      const key = `${sub.categoryId}|${sub.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
