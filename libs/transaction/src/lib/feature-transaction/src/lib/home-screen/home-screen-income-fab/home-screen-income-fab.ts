import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '@data-access-transaction';
import { TransactionState } from '../../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../../transaction-form/transaction-form';

@Component({
  selector: 'transaction-home-screen-income-fab',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-fab
      class="fab-income"
      i18n-aria-label="@@fabIncome.ariaLabel"
      aria-label="Dodaj przychód"
      (click)="openIncomeDialog()"
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

  protected async openIncomeDialog(): Promise<void> {
    const categories = await this.categoryService.getCategoriesAsync();
    const incomeCategory = categories.find(
      (c) => c.transactionType === 'income',
    );
    if (!incomeCategory) return;

    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: { category: incomeCategory },
      minWidth: '320px',
      maxWidth: '480px',
      width: '100%',
      position: { top: '20%' },
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
        });
      }
    });
  }
}