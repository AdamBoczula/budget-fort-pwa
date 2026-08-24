import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '@data-access-transaction';
import { CategoriesQuickAddComponent } from '../categories-quick-add/categories-quick-add';
import { LastTransactionComponent } from '../last-transaction/last-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';

@Component({
  selector: 'transaction-home-page-screen',
  imports: [
    CategoriesQuickAddComponent,
    LastTransactionComponent,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './home-screen.html',
  styleUrl: './home-screen.scss',
})
export class HomePageScreen {
  protected readonly transactionState = inject(TransactionState);
  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);

  /**
   * Wskazuje pierwsze ładowanie (skeleton-loader).
   * resource() ładuje automatycznie, więc nie trzeba OnInit.
   */
  protected readonly isInitialLoading = computed(
    () => this.transactionState.loading() && !this.transactionState.initialized(),
  );

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