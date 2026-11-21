// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Category, CategoryService } from '@data-access-transaction';
import {
  CategoryEditDialogComponent,
  CategoryEditDialogResult,
} from '../category-edit-dialog/category-edit-dialog';
import { TransactionDialogService } from '../service/transaction-dialog/transaction-dialog.service';

@Component({
  selector: 'transaction-categories-quick-add',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <section class="categories-quick-add">
      <div class="categories-quick-add__header">
        <h2 class="categories-quick-add__title" i18n="@@categoriesQuickAdd.title">
          Wybierz kategorię
        </h2>
        <button
          mat-button
          type="button"
          class="categories-quick-add__add-btn"
          (click)="openAddCategoryDialog()"
        >
          <mat-icon>add</mat-icon>
          <span i18n="@@categoriesQuickAdd.addCategory">Dodaj kategorię</span>
        </button>
      </div>

      @if (categories.value(); as cats) {
        <div class="categories-quick-add__grid">
          @for (category of cats; track category.id) {
            <button
              type="button"
              class="category-card"
              [style.--category-color]="category.colorHex"
              (click)="openTransactionForm(category)"
            >
              <span class="category-card__icon">
                <mat-icon>{{ category.icon }}</mat-icon>
              </span>
              <span class="category-card__name">{{ category.name }}</span>
            </button>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './categories-quick-add.scss',
})
export class CategoriesQuickAddComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionDialogService = inject(TransactionDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Kategorie załadowane przez resource(). */
  protected readonly categories = resource({
    loader: async () => {
      return this.categoryService.getVisibleCategoriesAsync();
    },
  });

  protected openTransactionForm(category: Category): void {
    this.transactionDialogService.openCreateDialog(
      category,
      $localize`:@@categoriesQuickAdd.addedTransaction:Dodano transakcję.`,
    );
  }

  protected openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(CategoryEditDialogComponent, {
      data: {},
      width: '400px',
      maxWidth: '95vw',
    });
    dialogRef.afterClosed().subscribe((result: CategoryEditDialogResult | null) => {
      if (result) {
        this.categories.reload();
        this.snackBar.open(
          $localize`:@@categoriesQuickAdd.addedCategory:Dodano kategorię.`,
          undefined,
          { duration: 3000 },
        );
      }
    });
  }
}
