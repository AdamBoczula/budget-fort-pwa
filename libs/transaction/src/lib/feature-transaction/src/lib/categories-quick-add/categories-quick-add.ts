// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, resource } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Category, CategoryService } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';

@Component({
  selector: 'transaction-categories-quick-add',
  imports: [MatIconModule, MatSnackBarModule],
  template: `
    <section class="categories-quick-add">
      <div class="categories-quick-add__header">
        <h2 class="categories-quick-add__title" i18n="@@categoriesQuickAdd.title">
          Wybierz kategorię
        </h2>
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
  private readonly transactionState = inject(TransactionState);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Kategorie załadowane przez resource(). */
  protected readonly categories = resource({
    loader: async () => {
      return this.categoryService.getVisibleCategoriesAsync();
    },
  });

  protected openTransactionForm(category: Category): void {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: { category },
      minWidth: '320px',
      maxWidth: '480px',
      width: '100%',
      panelClass: 'transaction-bottom-sheet-dialog',
      autoFocus: 'input',
    });
    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (result) {
        void this.transactionState.addTransaction({
          id: crypto.randomUUID(),
          amount: result.amount,
          date: result.date,
          categoryId: result.categoryId,
          accountId: result.accountId,
          comment: result.comment,
          subcategory: result.subcategory,
        });
        this.snackBar.open('Dodano transakcję.', undefined, { duration: 3000 });
      }
    });
  }
}
