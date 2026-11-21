// spec: docs/specs/budget/planowanie-budzetu.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Component, inject } from '@angular/core';
import { Transaction, CategoryService, Category } from '@data-access-transaction';
import { DashboardState } from '../service/dashboard-state/dashboard-state';
import { TransactionDialogService } from '../service/transaction-dialog/transaction-dialog.service';
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

      <transaction-dashboard-category-list (editTransaction)="onEditTransaction($event)" />
    </div>
  `,
  styleUrl: './dashboard-screen.scss',
})
export class DashboardPageScreen {
  private readonly dashboardState = inject(DashboardState);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionDialogService = inject(TransactionDialogService);

  private categories: Category[] = [];

  constructor() {
    // Załaduj kategorie do lokalnej pamięci (do mapowania)
    void this.categoryService.getCategoriesAsync().then((cats) => {
      this.categories = cats;
    });
  }

  protected onEditTransaction(transaction: Transaction): void {
    const category = this.categories.find((c) => c.id === transaction.categoryId);
    if (!category) {
      return;
    }

    this.transactionDialogService.openEditDialog(category, transaction, false);
  }
}
