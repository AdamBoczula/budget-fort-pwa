import { Component, computed, inject, resource } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Category,
  CategoryService,
  Transaction,
} from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';

@Component({
  selector: 'transaction-last-transaction',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './last-transaction.html',
  styleUrl: './last-transaction.scss',
})
export class LastTransactionComponent {
  private readonly transactionState = inject(TransactionState);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

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
  private readonly categories = computed(
    () => this.categoriesResource.value() ?? [],
  );

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
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

    return sorted;
  });

  protected getCategory(id: string): Category | undefined {
    return this.categoryMap()[id];
  }

  protected openEditDialog(transaction: Transaction): void {
    const category = this.getCategory(transaction.categoryId);
    if (!category) return;

    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: { category, transaction },
      minWidth: '320px',
      maxWidth: '480px',
      width: '100%',
    });

    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (result && result.transaction) {
        void this.transactionState.editTransaction({
          id: result.transaction.id,
          categoryId: result.categoryId,
          amount: result.amount,
          date: result.date,
          accountId: result.accountId,
          comment: result.comment,
        });
      }
    });
  }

  protected openDeleteDialog(transaction: Transaction): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialog);

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      void this.transactionState.deleteTransaction(transaction.id);
    });
  }
}

/** Simple confirmation dialog for delete action. */
@Component({
  selector: 'transaction-delete-confirm',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title i18n="@@deleteConfirm.title">Usuń transakcję</h2>
    <mat-dialog-content>
      <p i18n="@@deleteConfirm.message">
        Czy na pewno chcesz usunąć tę transakcję?
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" i18n="@@deleteConfirm.cancel">
        Anuluj
      </button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" i18n="@@deleteConfirm.confirm">
        Usuń
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteConfirmDialog {}
