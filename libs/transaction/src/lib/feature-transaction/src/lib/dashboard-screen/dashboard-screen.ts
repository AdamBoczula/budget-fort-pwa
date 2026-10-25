// spec: docs/specs/budget/planowanie-budzetu.md
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Transaction, CategoryService, Category } from '@data-access-transaction';
import { DashboardState } from '../service/dashboard-state/dashboard-state';
import { TransactionState } from '../service/transaction-state/transaction-state';
import {
  TransactionFormComponent,
  TransactionFormResult,
} from '../transaction-form/transaction-form';
import { DashboardPeriodSelectorComponent } from './dashboard-period-selector/dashboard-period-selector';
import { DashboardPieChartComponent } from './dashboard-pie-chart/dashboard-pie-chart';
import { DashboardCategoryListComponent } from './dashboard-category-list/dashboard-category-list';

@Component({
  selector: 'transaction-dashboard-page-screen',
  imports: [
    DashboardPeriodSelectorComponent,
    DashboardPieChartComponent,
    DashboardCategoryListComponent,
  ],
  template: `
    <div class="dashboard">
      <transaction-dashboard-period-selector />

      <transaction-dashboard-pie-chart />

      <transaction-dashboard-category-list
        (editTransaction)="onEditTransaction($event)"
      />
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }
  `],
})
export class DashboardPageScreen {
  private readonly dashboardState = inject(DashboardState);
  private readonly transactionState = inject(TransactionState);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  private categories: Category[] = [];

  constructor() {
    // Załaduj kategorie do lokalnej pamięci (do mapowania)
    void this.categoryService.getCategoriesAsync().then((cats) => {
      this.categories = cats;
    });
  }

  protected onEditTransaction(transaction: Transaction): void {
    const category = this.categories.find(
      (c) => c.id === transaction.categoryId,
    );
    if (!category) {return;}

    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: { category, transaction },
      minWidth: '320px',
      maxWidth: '480px',
      width: '100%',
      position: { top: '20%' },
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
      }
    });
  }
}