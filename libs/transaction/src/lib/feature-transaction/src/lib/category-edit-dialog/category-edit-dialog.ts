import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Category, CategoryService, TransactionType } from '@data-access-transaction';

export type CategoryEditDialogData = {
  category?: Category;
};

export type CategoryEditDialogResult = {
  category: Category;
};

const DEFAULT_COLORS: ReadonlyArray<string> = [
  '#16A34A',
  '#2563EB',
  '#DC2626',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#14B8A6',
  '#6366F1',
  '#D946EF',
  '#0EA5E9',
  '#E11D48',
  '#65A30D',
];

const DEFAULT_ICONS: ReadonlyArray<string> = [
  'restaurant',
  'shopping_cart',
  'directions_car',
  'home',
  'health_and_safety',
  'school',
  'flight',
  'fitness_center',
  'pets',
  'checkroom',
  'phone_android',
  'water_drop',
  'bolt',
  'local_gas_station',
  'credit_card',
  'savings',
  'payments',
  'money_off',
  'account_balance',
  'trending_up',
  'receipt_long',
  'celebration',
  'child_care',
  'coffee',
  'train',
];

@Component({
  selector: 'transaction-category-edit-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './category-edit-dialog.html',
  styleUrl: './category-edit-dialog.scss',
})
export class CategoryEditDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CategoryEditDialogComponent>);
  private readonly dialogData = inject<CategoryEditDialogData>(MAT_DIALOG_DATA);
  private readonly categoryService = inject(CategoryService);

  protected readonly isEditMode = !!this.dialogData?.category;

  protected name = this.dialogData?.category?.name ?? '';
  protected colorHex = this.dialogData?.category?.colorHex ?? '#16A34A';
  protected icon = this.dialogData?.category?.icon ?? 'restaurant';
  protected sortOrder = this.dialogData?.category?.sortOrder ?? 99;
  protected isHidden = this.dialogData?.category?.isHidden ?? false;
  protected transactionType: TransactionType | '' =
    this.dialogData?.category?.transactionType ?? '';

  protected readonly colors = DEFAULT_COLORS;
  protected readonly icons = DEFAULT_ICONS;

  protected get canSave(): boolean {
    return this.name.trim().length > 0 && !!this.colorHex && !!this.icon;
  }

  protected selectColor(hex: string): void {
    this.colorHex = hex;
  }

  protected selectIcon(icn: string): void {
    this.icon = icn;
  }

  /**
   *
   * moim zdaniem ta logika powinna iść do serwisu.
   */
  protected async save(): Promise<void> {
    if (!this.canSave) {
      return;
    }

    const now = new Date().toISOString();
    const dialogData = this.dialogData;
    const category: Category = dialogData?.category
      ? {
          ...dialogData.category,
          name: this.name.trim(),
          colorHex: this.colorHex,
          icon: this.icon,
          sortOrder: this.sortOrder,
          isHidden: this.isHidden,
          transactionType: this.transactionType || undefined,
          updatedAt: now,
        }
      : {
          id: crypto.randomUUID(),
          name: this.name.trim(),
          colorHex: this.colorHex,
          icon: this.icon,
          sortOrder: this.sortOrder,
          isHidden: this.isHidden,
          transactionType: this.transactionType || undefined,
          createdAt: now,
          updatedAt: now,
        };

    await this.categoryService.updateCategoryAsync(category);
    this.dialogRef.close({ category });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
