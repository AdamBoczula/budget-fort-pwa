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
      map((categories) => categories.filter((category) => !category.isHidden)),
    );
  }

  public async getVisibleCategoriesAsync(): Promise<Category[]> {
    const categories = await this.categoryStore.getCategoriesAsync();
    return categories.filter((category) => !category.isHidden);
  }
}
