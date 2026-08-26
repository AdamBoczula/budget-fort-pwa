import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Category } from '../model/category.type';
import { CategoryStore } from './category-store';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoryStore = inject(CategoryStore);

  public getCategories(): Observable<Category[]> {
    return this.categoryStore.getCategories();
  }

  public async getCategoriesAsync(): Promise<Category[]> {
    return this.categoryStore.getCategoriesAsync();
  }

  public getVisibleCategories(): Observable<Category[]> {
    return this.categoryStore.getCategories().pipe(
      map((categories) =>
        categories.filter(
          (category) => !category.isHidden && category.transactionType !== 'income',
        ),
      ),
    );
  }

  public async getVisibleCategoriesAsync(): Promise<Category[]> {
    const categories = await this.categoryStore.getCategoriesAsync();
    return categories.filter(
      (category) => !category.isHidden && category.transactionType !== 'income',
    );
  }

  /* ---- CRUD ---- */

  public async createCategoryAsync(category: Category): Promise<void> {
    await this.categoryStore.createCategoryAsync(category);
  }

  public async updateCategoryAsync(category: Category): Promise<void> {
    await this.categoryStore.updateCategoryAsync(category);
  }

  public async deleteCategoryAsync(id: string): Promise<void> {
    await this.categoryStore.deleteCategoryAsync(id);
  }

  public async reorderCategoriesAsync(categories: Category[]): Promise<void> {
    await this.categoryStore.reorderCategoriesAsync(categories);
  }
}
