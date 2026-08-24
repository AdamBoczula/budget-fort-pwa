import { Component, inject, resource } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Category, CategoryService } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';

@Component({
  selector: 'transaction-categories-quick-add',
  imports: [MatIconModule],
  templateUrl: './categories-quick-add.html',
  styleUrl: './categories-quick-add.scss',
})
export class CategoriesQuickAddComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionState = inject(TransactionState);
  private readonly dialog = inject(MatDialog);

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
          subcategory: result.subcategory,
        });
      }
    });
  }
}