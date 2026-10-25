// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  Category,
  CategoryService,
  TransactionType,
} from '@data-access-transaction';

export type CategoryEditDialogData = {
  category: Category;
};

export type CategoryEditDialogResult =
  | { action: 'save'; category: Category }
  | { action: 'delete'; categoryId: string };

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
  selector: 'budget-category-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title i18n="@@budgetCategoryEditDialog.title">
      Edytuj kategorię
    </h2>

    <mat-dialog-content (keydown)="onKeydown($event)">
      <form [formGroup]="form" class="dialog-form">
        <!-- Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@budgetCategoryEditDialog.name">Nazwa kategorii</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <!-- Color picker -->
        <span class="picker-label" i18n="@@budgetCategoryEditDialog.color">Kolor</span>
        <div class="color-grid" role="radiogroup" aria-label="Wybierz kolor">
          @for (c of colors; track c) {
            <div
              class="color-swatch"
              [class.selected]="c === selectedColor"
              [style.background]="c"
              (click)="selectColor(c)"
              (keydown.enter)="selectColor(c)"
              tabindex="0"
              role="radio"
              [attr.aria-checked]="c === selectedColor"
              [attr.aria-label]="'Kolor ' + c"
            ></div>
          }
        </div>

        <!-- Icon picker -->
        <span class="picker-label" i18n="@@budgetCategoryEditDialog.icon">Ikona</span>
        <div class="icon-grid" role="radiogroup" aria-label="Wybierz ikonę">
          @for (icn of icons; track icn) {
            <div
              class="icon-item"
              [class.selected]="icn === selectedIcon"
              (click)="selectIcon(icn)"
              (keydown.enter)="selectIcon(icn)"
              tabindex="0"
              role="radio"
              [attr.aria-checked]="icn === selectedIcon"
              [attr.aria-label]="'Ikona ' + icn"
            >
              <mat-icon>{{ icn }}</mat-icon>
            </div>
          }
        </div>

        <!-- Sort Order -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@budgetCategoryEditDialog.sortOrder">Kolejność sortowania</mat-label>
          <input matInput type="number" formControlName="sortOrder" min="0" />
        </mat-form-field>

        <!-- Transaction type toggle -->
        <span class="picker-label" i18n="@@budgetCategoryEditDialog.transactionType">Typ transakcji</span>
        <mat-button-toggle-group
          formControlName="transactionType"
          aria-label="Typ transakcji"
          class="full-width"
        >
          <mat-button-toggle value="expense" i18n="@@budgetCategoryEditDialog.typeExpense">
            Wydatek
          </mat-button-toggle>
          <mat-button-toggle value="income" i18n="@@budgetCategoryEditDialog.typeIncome">
            Przychód
          </mat-button-toggle>
        </mat-button-toggle-group>

        <!-- Hidden toggle -->
        <mat-slide-toggle formControlName="isHidden" i18n="@@budgetCategoryEditDialog.hidden">
          Ukryta kategoria
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-button
        color="warn"
        (click)="onDelete()"
        i18n="@@budgetCategoryEditDialog.delete"
      >
        Usuń kategorię
      </button>
      <button
        mat-button
        (click)="onCancel()"
        i18n="@@budgetCategoryEditDialog.cancel"
      >
        Anuluj
      </button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="onSave()"
        i18n="@@budgetCategoryEditDialog.save"
      >
        Zapisz
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './category-edit-dialog.component.scss',
})
export class CategoryEditDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<CategoryEditDialogComponent>);
  private readonly dialogData =
    inject<CategoryEditDialogData>(MAT_DIALOG_DATA);
  private readonly categoryService = inject(CategoryService);
  private readonly confirmDialog = inject(MatDialog);

  protected readonly colors = DEFAULT_COLORS;
  protected readonly icons = DEFAULT_ICONS;

  protected readonly form = new FormGroup({
    name: new FormControl<string>(this.dialogData.category.name, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    colorHex: new FormControl<string>(
      this.dialogData.category.colorHex,
      { nonNullable: true, validators: [Validators.required] },
    ),
    icon: new FormControl<string>(
      this.dialogData.category.icon,
      { nonNullable: true, validators: [Validators.required] },
    ),
    sortOrder: new FormControl<number>(
      this.dialogData.category.sortOrder,
      { nonNullable: true, validators: [Validators.min(0)] },
    ),
    transactionType: new FormControl<TransactionType>(
      this.dialogData.category.transactionType ?? 'expense',
      { nonNullable: true },
    ),
    isHidden: new FormControl<boolean>(
      this.dialogData.category.isHidden,
      { nonNullable: true },
    ),
  });

  protected get selectedColor(): string {
    return this.form.controls.colorHex.value;
  }
  protected get selectedIcon(): string {
    return this.form.controls.icon.value;
  }

  protected selectColor(hex: string): void {
    this.form.controls.colorHex.setValue(hex);
  }

  protected selectIcon(icn: string): void {
    this.form.controls.icon.setValue(icn);
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const now = new Date().toISOString();

    const category: Category = {
      ...this.dialogData.category,
      name: formValue.name.trim(),
      colorHex: formValue.colorHex,
      icon: formValue.icon,
      sortOrder: formValue.sortOrder,
      isHidden: formValue.isHidden,
      transactionType: formValue.transactionType,
      updatedAt: now,
    };

    await this.categoryService.updateCategoryAsync(category);
    this.dialogRef.close({ action: 'save', category } satisfies CategoryEditDialogResult);
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.form.valid) {
      event.preventDefault();
      void this.onSave();
    }
  }

  protected async onDelete(): Promise<void> {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć kategorię "${this.dialogData.category.name}"?`,
    );
    if (!confirmed) {
      return;
    }

    const categoryId = this.dialogData.category.id;
    await this.categoryService.deleteCategoryAsync(categoryId);
    this.dialogRef.close({
      action: 'delete',
      categoryId,
    } satisfies CategoryEditDialogResult);
  }
}