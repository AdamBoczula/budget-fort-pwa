// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, TransactionType } from '@data-access-transaction';
import { TransactionState } from '../../service/transaction-state/transaction-state';
import {
  TRANSACTION_FORM_DIALOG_CONFIG,
  TransactionFormComponent,
  TransactionFormResult,
} from '../../transaction-form/transaction-form';

@Component({
  selector: 'transaction-home-screen-income-fab',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  host: {
    '(document:keydown.escape)': 'close()',
  },
  template: `
    @if (isOpen()) {
      <div class="fab-backdrop" aria-hidden="true" (click)="close()"></div>
      <div class="fab-speed-dial__actions" role="group" aria-label="Wybierz typ transakcji">
        <div class="fab-speed-dial__item">
          <span class="fab-speed-dial__label" i18n="@@transactionForm.expense">Wydatek</span>
          <button
            mat-mini-fab
            type="button"
            class="fab-action fab-action--expense"
            i18n-aria-label="@@fabExpense.ariaLabel"
            aria-label="Dodaj wydatek"
            (click)="openTransactionDialog('expense')"
          >
            <mat-icon>trending_down</mat-icon>
          </button>
        </div>
        <div class="fab-speed-dial__item">
          <span class="fab-speed-dial__label" i18n="@@transactionForm.income">Przychód</span>
          <button
            mat-mini-fab
            type="button"
            class="fab-action fab-action--income"
            i18n-aria-label="@@fabIncome.ariaLabel"
            aria-label="Dodaj przychód"
            (click)="openTransactionDialog('income')"
          >
            <mat-icon>trending_up</mat-icon>
          </button>
        </div>
      </div>
    }
    <button
      mat-fab
      type="button"
      class="fab-income"
      [class.fab-income--open]="isOpen()"
      i18n-aria-label="@@fabAdd.ariaLabel"
      aria-label="Dodaj transakcję"
      [attr.aria-expanded]="isOpen()"
      (click)="toggle()"
    >
      <mat-icon>add</mat-icon>
    </button>
  `,
  styleUrl: './home-screen-income-fab.scss',
})
export class HomeScreenIncomeFabComponent {
  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionState = inject(TransactionState);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isOpen = signal(false);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected async openTransactionDialog(type: TransactionType): Promise<void> {
    this.close();
    const categories = await this.categoryService.getCategoriesAsync();
    const category = categories.find((c) => (c.transactionType ?? 'expense') === type);
    if (!category) {
      const emptyMessage =
        type === 'income'
          ? 'Brak kategorii przychodów. Najpierw dodaj kategorię w ustawieniach.'
          : 'Brak kategorii wydatków. Najpierw dodaj kategorię w ustawieniach.';
      this.snackBar.open(emptyMessage, undefined, { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(TransactionFormComponent, {
      ...TRANSACTION_FORM_DIALOG_CONFIG,
      data: { category },
      autoFocus: 'input',
    });

    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (result) {
        const recurringOptions = result.isRecurring
          ? { isRecurring: true, dayOfMonth: result.recurringDayOfMonth }
          : undefined;
        void this.transactionState.addTransaction(
          {
            id: crypto.randomUUID(),
            amount: result.amount,
            date: result.date,
            categoryId: result.categoryId,
            accountId: result.accountId,
            comment: result.comment,
            subcategory: result.subcategory,
          },
          ...(recurringOptions ? [recurringOptions] : []),
        );
        const successMessage = result.type === 'income' ? 'Dodano przychód.' : 'Dodano wydatek.';
        this.snackBar.open(successMessage, undefined, { duration: 3000 });
      }
    });
  }
}
