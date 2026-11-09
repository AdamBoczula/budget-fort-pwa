// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, computed, inject, resource } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Category, CategoryService, Transaction } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';
import { LastTransactionItemComponent } from './last-transaction-item/last-transaction-item';

@Component({
  selector: 'transaction-last-transaction',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    LastTransactionItemComponent,
  ],
  template: `
    <section class="last-transactions">
      <div class="last-transactions__header">
        <h2 class="last-transactions__title" i18n="@@lastTransactions.title">
          Ostatnie transakcje
        </h2>
        @if (lastTransactions().length > 0) {
          <span class="last-transactions__count">{{ lastTransactions().length }}</span>
        }
      </div>

      @if (lastTransactions().length === 0) {
        <div class="last-transactions__empty" data-testid="transactions-empty">
          <svg
            class="last-transactions__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
          <p class="last-transactions__empty-text" i18n="@@lastTransactions.empty">
            Brak transakcji. Dodaj pierwszą za pomocą przycisków powyżej.
          </p>
        </div>
      }

      @for (tx of lastTransactions(); track tx.id) {
        <transaction-last-transaction-item
          [transaction]="tx"
          [category]="categoryMap()[tx.categoryId]"
          (edit)="openEditDialog(tx)"
          (deleteItem)="openDeleteDialog(tx)"
        />
      }
    </section>
  `,
  styleUrl: './last-transaction.scss',
})
export class LastTransactionComponent {
  private readonly transactionState = inject(TransactionState);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Signal-based category lookup map.
   * Loaded via `resource()` for consistency with the rest of the app.
   */
  private readonly categoriesResource = resource({
    loader: async () => {
      return this.categoryService.getCategoriesAsync();
    },
  });

  /** Categories as a flat list (backward compat). */
  private readonly categories = computed(() => this.categoriesResource.value() ?? []);

  protected readonly categoryMap = computed(() => {
    const map: Record<string, Category> = {};
    for (const cat of this.categories()) {
      map[cat.id] = cat;
    }
    return map;
  });

  /**
   * All transactions from the current month, sorted by date descending.
   */
  protected readonly lastTransactions = computed(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const all = this.transactionState.transactions();
    const sorted = [...all]
      .filter((tx) => {
        const d = new Date(tx.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sorted;
  });

  protected openEditDialog(transaction: Transaction): void {
    const category = this.categoryMap()[transaction.categoryId];
    if (!category) {
      return;
    }

    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: { category, transaction },
      minWidth: '320px',
      maxWidth: '480px',
      width: '100%',
      panelClass: 'transaction-bottom-sheet-dialog',
    });

    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (result?.transaction) {
        void this.transactionState.editTransaction({
          id: result.transaction.id,
          categoryId: result.categoryId,
          amount: result.amount,
          date: result.date,
          accountId: result.accountId,
          comment: result.comment,
          subcategory: result.subcategory,
        });
        this.snackBar.open('Zapisano zmiany.', undefined, { duration: 3000 });
      }
    });
  }

  protected openDeleteDialog(transaction: Transaction): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialog);

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      void this.transactionState.deleteTransaction(transaction.id);

      const snackBarRef = this.snackBar.open('Usunięto transakcję.', 'Cofnij', { duration: 5000 });
      snackBarRef.onAction().subscribe(() => {
        void this.transactionState.addTransaction(transaction);
      });
    });
  }
}

/** Simple confirmation dialog for delete action. */
// spec: docs/qa/2026-10-21-ui-ux-audit.md
@Component({
  selector: 'transaction-delete-confirm',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, A11yModule],
  template: `
    <h2 mat-dialog-title i18n="@@deleteConfirm.title">Usuń transakcję</h2>
    <mat-dialog-content (keydown.enter)="dialogRef.close(true)">
      <p i18n="@@deleteConfirm.message">Czy na pewno chcesz usunąć tę transakcję?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button cdkFocusInitial [mat-dialog-close]="false" i18n="@@deleteConfirm.cancel">
        Anuluj
      </button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" i18n="@@deleteConfirm.confirm">
        Usuń
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteConfirmDialog {
  protected readonly dialogRef = inject(MatDialogRef<DeleteConfirmDialog>);
}
