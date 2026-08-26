import { Component, computed, inject, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CategoryService,
  SubcategoryService,
  Subcategory,
  Category,
} from '@data-access-transaction';
import {
  CategoryEditDialogComponent,
  CategoryEditDialogData,
  CategoryEditDialogResult,
} from '../../category-edit-dialog/category-edit-dialog';
import {
  SubcategoryEditDialogComponent,
  SubcategoryEditDialogData,
  SubcategoryEditDialogResult,
} from '../../subcategory-edit-dialog/subcategory-edit-dialog';

@Component({
  selector: 'transaction-settings-categories-section',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './settings-categories-section.html',
  styleUrl: './settings-categories-section.scss',
})
export class SettingsCategoriesSectionComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly dialog = inject(MatDialog);

  /* ---- data loading ---- */

  protected readonly categoriesData = resource({
    loader: async () => {
      const allCategories =
        await this.categoryService.getCategoriesAsync();

      const map = new Map<string, Subcategory[]>();
      for (const category of allCategories) {
        const subs =
          await this.subcategoryService.getSubcategoriesAsync(category.id);
        map.set(category.id, subs);
      }

      return { categories: allCategories, subcategoriesByCategory: map };
    },
  });

  protected readonly categories = computed(
    () => this.categoriesData.value()?.categories ?? [],
  );

  protected readonly subcategoriesByCategory = computed(
    () => this.categoriesData.value()?.subcategoriesByCategory ?? new Map(),
  );

  protected readonly visibleCategories = computed(() =>
    this.categories().filter((c) => !c.isHidden),
  );

  /* ---- subcategory helpers ---- */

  protected getSubcategories(categoryId: string): Subcategory[] {
    return this.subcategoriesByCategory().get(categoryId) ?? [];
  }

  /* ---- category CRUD ---- */

  protected async addCategory(): Promise<void> {
    const ref = this.dialog.open<
      CategoryEditDialogComponent,
      CategoryEditDialogData,
      CategoryEditDialogResult
    >(CategoryEditDialogComponent, { width: '420px' });
    const result = await ref.afterClosed().toPromise();
    if (result) {
      this.categoriesData.reload();
    }
  }

  protected async editCategory(category: Category): Promise<void> {
    const ref = this.dialog.open<
      CategoryEditDialogComponent,
      CategoryEditDialogData,
      CategoryEditDialogResult
    >(CategoryEditDialogComponent, {
      width: '420px',
      data: { category },
    });
    const result = await ref.afterClosed().toPromise();
    if (result) {
      this.categoriesData.reload();
    }
  }

  protected async deleteCategory(category: Category): Promise<void> {
    if (!confirm(`Usunąć kategorię „${category.name}”?`)) return;
    await this.categoryService.deleteCategoryAsync(category.id);
    this.categoriesData.reload();
  }

  /* ---- subcategory CRUD ---- */

  protected async addSubcategory(categoryId: string): Promise<void> {
    const ref = this.dialog.open<
      SubcategoryEditDialogComponent,
      SubcategoryEditDialogData,
      SubcategoryEditDialogResult
    >(SubcategoryEditDialogComponent, {
      width: '380px',
      data: { categoryId },
    });
    const result = await ref.afterClosed().toPromise();
    if (result) {
      this.categoriesData.reload();
    }
  }

  protected async editSubcategory(
    categoryId: string,
    subcategory: Subcategory,
  ): Promise<void> {
    const ref = this.dialog.open<
      SubcategoryEditDialogComponent,
      SubcategoryEditDialogData,
      SubcategoryEditDialogResult
    >(SubcategoryEditDialogComponent, {
      width: '380px',
      data: { categoryId, subcategory },
    });
    const result = await ref.afterClosed().toPromise();
    if (result) {
      this.categoriesData.reload();
    }
  }

  protected async deleteSubcategory(subcategory: Subcategory): Promise<void> {
    if (!confirm(`Usunąć podkategorię „${subcategory.name}”?`)) return;
    await this.subcategoryService.deleteSubcategoryAsync(subcategory.id);
    this.categoriesData.reload();
  }
}