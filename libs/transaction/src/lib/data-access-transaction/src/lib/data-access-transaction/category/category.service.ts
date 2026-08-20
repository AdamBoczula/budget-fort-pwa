import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Category } from '../model/category.type';
import { MOCK_PL_CATEGORIES } from './category.mock';
import { CategoryStore } from './category-store';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoryStore = inject(CategoryStore);

  public getCategories(): Observable<Category[]> {
    return this.categoryStore
      .seedCategoriesIfEmpty(MOCK_PL_CATEGORIES)
      .pipe(switchMap(() => this.categoryStore.getCategories()));
  }

  public getVisibleCategories(): Observable<Category[]> {
    return this.getCategories().pipe(
      map((categories) => categories.filter((category) => !category.isHidden)),
    );
  }
}
