import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Category, Transaction } from '@data-access-transaction';
import {
  TRANSACTION_FORM_DIALOG_CONFIG,
  TransactionFormComponent,
  TransactionFormResult,
} from '../../transaction-form/transaction-form';
import { TransactionState } from '../transaction-state/transaction-state';

@Injectable({ providedIn: 'root' })
export class TransactionDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly transactionState = inject(TransactionState);
  private readonly snackBar = inject(MatSnackBar);

  /** Opens the fullscreen transaction form in create mode and persists the result. */
  openCreateDialog(category: Category, customSuccessMessage?: string): void {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      ...TRANSACTION_FORM_DIALOG_CONFIG,
      data: { category },
      autoFocus: 'input',
    });

    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (!result) {
        return;
      }
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
      const message =
        customSuccessMessage ??
        (result.type === 'income'
          ? $localize`:@@transactionDialog.addedIncome:Dodano przychód.`
          : $localize`:@@transactionDialog.addedExpense:Dodano wydatek.`);
      this.snackBar.open(message, undefined, { duration: 3000 });
    });
  }

  /** Opens the fullscreen transaction form in edit mode and persists changes. */
  openEditDialog(category: Category, transaction: Transaction, showSuccessToast = true): void {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      ...TRANSACTION_FORM_DIALOG_CONFIG,
      data: { category, transaction },
    });

    dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
      if (!result?.transaction) {
        return;
      }
      void this.transactionState.editTransaction({
        id: result.transaction.id,
        categoryId: result.categoryId,
        amount: result.amount,
        date: result.date,
        accountId: result.accountId,
        comment: result.comment,
        subcategory: result.subcategory,
      });
      if (showSuccessToast) {
        this.snackBar.open(
          $localize`:@@transactionDialog.savedChanges:Zapisano zmiany.`,
          undefined,
          {
            duration: 3000,
          },
        );
      }
    });
  }
}
