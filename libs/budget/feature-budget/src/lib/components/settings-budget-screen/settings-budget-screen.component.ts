// spec: docs/specs/budget/planowanie-budzetu.md

import { Component, computed, effect, inject, resource, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  CategoryService,
  Category,
  TransactionService,
  Transaction,
} from '@data-access-transaction';
import { BudgetService, CategoryBudgetService, CategoryBudget } from '@data-access-budget';
import { isInMonth } from '@ui-budget';
import { BudgetState } from '../../services/budget-state';
import { BudgetAggregationService } from '../../services/budget-aggregation.service';
import { BudgetCurrentMonthCardComponent } from '../budget-current-month-card/budget-current-month-card.component';
import { BudgetPreviousMonthCardComponent } from '../budget-previous-month-card/budget-previous-month-card.component';
import { BudgetCategoryCardComponent } from '../budget-category-card/budget-category-card.component';
import { BudgetQuickActionsComponent } from '../budget-quick-actions/budget-quick-actions.component';

@Component({
  selector: 'budget-settings-budget-screen',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BudgetCurrentMonthCardComponent,
    BudgetPreviousMonthCardComponent,
    BudgetCategoryCardComponent,
    BudgetQuickActionsComponent,
  ],
  template: `
    <div class="settings-budget">
      @if (loading()) {
        <div class="settings-budget__loading" aria-busy="true">
          <mat-progress-spinner mode="indeterminate" diameter="40" />
          <span>Ładowanie...</span>
        </div>
      } @else {
        <h1 class="settings-budget__title">Budżet miesięczny</h1>

        <mat-card class="settings-budget__card" appearance="outlined">
          <mat-card-content>
            <budget-current-month-card
              [spent]="currentMonthSpent()"
              [limit]="agg.overallBudget()"
              [percentage]="agg.currentMonthPercentage()"
            />
          </mat-card-content>
        </mat-card>

        <budget-quick-actions />

        @if (agg.previousMonthSummary(); as summary) {
          <mat-card class="settings-budget__card" appearance="outlined">
            <mat-card-content>
              <budget-previous-month-card
                [summary]="summary"
                [comparison]="agg.monthComparison()"
              />
            </mat-card-content>
          </mat-card>
        }

        <div class="settings-budget__categories-header">
          <h2 class="settings-budget__section-title">Limity kategorii</h2>
          @if (agg.previousMonthSummary()) {
            <button mat-button color="primary" (click)="copyLimitsFromPreviousMonth()">
              <mat-icon>content_copy</mat-icon>
              Kopiuj limity z poprzedniego miesiąca
            </button>
          }
        </div>

        @if ((categories()?.length ?? 0) === 0) {
          <p class="settings-budget__empty">Brak kategorii wydatkowych</p>
        } @else {
          @for (category of categories(); track category.id) {
            <mat-card class="settings-budget__card" appearance="outlined">
              <mat-card-content>
                <budget-category-card
                  [category]="category"
                  [spending]="agg.categorySpendingMap().get(category.id)"
                  [control]="getCategoryControl(category.id)"
                />
              </mat-card-content>
            </mat-card>
          }
        }

        <div class="settings-budget__actions">
          <button mat-raised-button color="primary" [disabled]="saving()" (click)="onSave()">
            @if (saving()) {
              <mat-progress-spinner mode="indeterminate" diameter="20" />
            }
            Zapisz
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './settings-budget-screen.component.scss',
})
export class SettingsBudgetScreenComponent {
  protected readonly agg = inject(BudgetAggregationService);

  private readonly budgetService = inject(BudgetService);
  private readonly categoryBudgetService = inject(CategoryBudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly budgetState = inject(BudgetState);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);

  readonly categoryForm = new FormRecord<FormControl<number | null>>({});

  private readonly budgetResource = resource({
    loader: async () => this.budgetService.getBudget(),
  });

  readonly categoriesResource = resource({
    loader: async () => this.categoryService.getVisibleCategoriesAsync(),
  });

  private readonly categoryBudgetsResource = resource({
    loader: async () => this.categoryBudgetService.getAll(),
  });

  readonly transactionsResource = resource<Transaction[], unknown>({
    loader: async () => this.transactionService.getTransactionsAsync(),
  });

  readonly loading = signal(true);

  readonly currentMonthSpent = computed(() => {
    const txs = this.transactionsResource.value() ?? [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return txs
      .filter((tx) => tx.amount < 0 && isInMonth(tx.date, year, month))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.categoryForm.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.agg.bumpFormVersion());

    // Wire up aggregation service
    this.agg.setFormValueFn(() => this.categoryForm.value as Record<string, number | null>);

    effect(() => {
      this.agg.transactions.set(this.transactionsResource.value() ?? []);
    });
    effect(() => {
      this.agg.categories.set(this.categoriesResource.value() ?? []);
    });
    effect(() => {
      this.agg.categoryBudgets.set(this.categoryBudgetsResource.value() ?? []);
    });

    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const categoryBudgets = await this.categoryBudgetService.getAll();
      for (const cb of categoryBudgets) {
        const id = String(cb.categoryId);
        if (!this.categoryForm.contains(id)) {
          this.categoryForm.addControl(
            id,
            new FormControl<number | null>(cb.amount, {
              validators: [Validators.min(0)],
            }),
          );
        } else {
          this.categoryForm.controls[id].setValue(cb.amount);
        }
      }

      const total = this.agg.overallBudget();
      await this.budgetService.saveBudget(total);
    } finally {
      this.loading.set(false);
    }
  }

  getCategoryControl(categoryId: string): FormControl<number | null> {
    if (!this.categoryForm.contains(categoryId)) {
      this.categoryForm.addControl(
        categoryId,
        new FormControl<number | null>(0, {
          validators: [Validators.min(0)],
        }),
      );
    }
    return this.categoryForm.controls[categoryId];
  }

  copyLimitsFromPreviousMonth(): void {
    const prev = this.agg.previousMonthSummary();
    if (!prev) {return;}
    for (const cat of prev.categorySummaries) {
      this.getCategoryControl(cat.categoryId).setValue(cat.limit > 0 ? cat.limit : 0);
    }
  }

  async onSave(): Promise<void> {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const formValues = this.categoryForm.value;
      const totalBudget = this.agg.overallBudget();
      await this.budgetService.saveBudget(totalBudget);

      const existingBudgets = await this.categoryBudgetService.getAll();
      const existingMap = new Map<string, CategoryBudget>();
      for (const cb of existingBudgets) {
        existingMap.set(String(cb.categoryId), cb);
      }

      const categories = this.categoriesResource.value() ?? [];
      for (const cat of categories) {
        const limit = formValues[cat.id];
        if (limit !== null && limit > 0) {
          await this.categoryBudgetService.save(cat.id, cat.name, limit);
        } else if (existingMap.has(cat.id)) {
          await this.categoryBudgetService.deleteByCategoryId(cat.id);
        }
      }

      this.budgetState.reload();
      this.snackBar.open('Zapisano', undefined, { duration: 2000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected readonly categories = this.categoriesResource.value;
}
