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
import { BudgetProgressBarComponent } from '@ui-budget';
import { BudgetState } from '@feature-budget';

@Component({
  selector: 'transaction-dashboard-page-screen',
  imports: [
    DashboardPeriodSelectorComponent,
    DashboardPieChartComponent,
    DashboardCategoryListComponent,
    BudgetProgressBarComponent,
  ],
  template: `
    <div class="dashboard">
      <transaction-dashboard-period-selector />

      <!-- Budget progress section -->
      @if (budgetState.loading()) {
        <div class="dashboard__budget-skeleton" aria-busy="true">
          <div class="skeleton-bar"></div>
        </div>
      } @else if (budgetState.error()) {
        <div class="dashboard__budget-error">
          <p>{{ budgetState.error() }}</p>
          <button (click)="budgetState.reload()">Spróbuj ponownie</button>
        </div>
      } @else {
        <!-- Overall budget bar (only if limit > 0) -->
        @if (overallProgress().limit > 0) {
          <section class="dashboard__budget-section" aria-labelledby="budget-overall-heading">
            <h2 id="budget-overall-heading" class="dashboard__section-title">Budżet miesięczny</h2>
            <budget-progress-bar
              [spent]="overallProgress().spent"
              [limit]="overallProgress().limit"
              label="Ogółem"
            />
          </section>
        } @else {
          <section class="dashboard__budget-section dashboard__budget-section--empty">
            <p class="dashboard__empty-message">
              Nie ustawiono budżetu miesięcznego.
              <a routerLink="/settings/budget">Ustaw budżet</a>
            </p>
          </section>
        }

        <!-- Category budget bars (only categories with limits) -->
        @if (categoryProgresses().length > 0) {
          <section class="dashboard__budget-section" aria-labelledby="budget-categories-heading">
            <h2 id="budget-categories-heading" class="dashboard__section-title">Limity kategorii</h2>
            @for (cp of categoryProgresses(); track cp.categoryId) {
              <budget-progress-bar
                [spent]="cp.spent"
                [limit]="cp.limit"
                [label]="cp.categoryName"
              />
            }
          </section>
        }
      }

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

    .dashboard__section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px;
    }

    .dashboard__budget-section {
      margin-bottom: 16px;
    }

    .dashboard__budget-section--empty {
      color: var(--mat-sys-on-surface-variant, #666);
      font-style: italic;
    }

    .dashboard__empty-message {
      margin: 8px 0;
    }

    .dashboard__budget-skeleton {
      padding: 16px 0;
    }

    .skeleton-bar {
      height: 12px;
      background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
      max-width: 400px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .dashboard__budget-error {
      padding: 12px;
      background: var(--mat-sys-error-container, #fce4ec);
      border-radius: 8px;
    }

    .dashboard__budget-error p {
      margin: 0 0 8px;
      color: var(--mat-sys-error, #c62828);
    }

    .dashboard__budget-error button {
      border: none;
      background: var(--mat-sys-error, #c62828);
      color: #fff;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
  `],
})
export class DashboardPageScreen {
  private readonly dashboardState = inject(DashboardState);
  private readonly transactionState = inject(TransactionState);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  readonly budgetState = inject(BudgetState);

  private categories: Category[] = [];

  readonly overallProgress = this.budgetState.overallProgress;
  readonly categoryProgresses = this.budgetState.categoryProgresses;

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