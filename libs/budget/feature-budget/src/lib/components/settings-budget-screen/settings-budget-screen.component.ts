// spec: docs/specs/budget/przeglad-historii-budzetu.md
// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { Component, computed, effect, inject, resource, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
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
import {
  CategoryEditDialogComponent,
  CategoryEditDialogResult,
} from '../category-edit-dialog/category-edit-dialog.component';

type PeriodMode = 'month' | 'year';

/** Get the current year and month in local timezone. */
function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

@Component({
  selector: 'budget-settings-budget-screen',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BudgetCurrentMonthCardComponent,
    BudgetPreviousMonthCardComponent,
    BudgetCategoryCardComponent,
    BudgetQuickActionsComponent,
    CategoryEditDialogComponent,
  ],
  template: `
    <div class="settings-budget">
      @if (loading()) {
        <div class="settings-budget__loading" aria-busy="true">
          <mat-progress-spinner mode="indeterminate" diameter="40" />
          <span>Ładowanie...</span>
        </div>
      } @else {
        <!-- Period selector -->
        <div class="period-selector">
          <div class="period-selector__navigation">
            <button
              mat-icon-button
              (click)="goToPrevious()"
              [disabled]="!canGoPrevious()"
              aria-label="Poprzedni okres"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>

            <span class="period-selector__label">{{ periodLabel() }}</span>

            <button
              mat-icon-button
              (click)="goToNext()"
              [disabled]="!canGoNext()"
              aria-label="Następny okres"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>

          <div class="period-selector__controls">
            <mat-button-toggle-group
              [value]="periodMode()"
              (change)="onModeChange($event.value)"
              aria-label="Tryb okresu"
            >
              <mat-button-toggle value="month">Miesiąc</mat-button-toggle>
              <mat-button-toggle value="year">Rok</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <h1 class="settings-budget__title">{{ pageTitle() }}</h1>

        <mat-card class="settings-budget__card" appearance="outlined">
          <mat-card-content>
            <budget-current-month-card
              [spent]="selectedPeriodSpent()"
              [limit]="agg.overallBudget()"
              [percentage]="agg.selectedPeriodPercentage()"
            />
          </mat-card-content>
        </mat-card>

        @if (isCurrentPeriod()) {
          <budget-quick-actions />
        }

        @if (agg.selectedPreviousPeriodSummary(); as summary) {
          <mat-card class="settings-budget__card" appearance="outlined">
            <mat-card-content>
              <budget-previous-month-card
                [summary]="summary"
                [comparison]="agg.selectedPeriodComparison()"
              />
            </mat-card-content>
          </mat-card>
        }

        @if (isCurrentPeriod()) {
          <div class="settings-budget__categories-header">
            <h2 class="settings-budget__section-title">Limity kategorii</h2>
            @if (agg.selectedPreviousPeriodSummary()) {
              <button mat-button color="primary" (click)="copyLimitsFromPreviousMonth()">
                <mat-icon>content_copy</mat-icon>
                Kopiuj limity z poprzedniego miesiąca
              </button>
            }
          </div>

          @if (expenseCategories().length === 0) {
            <p class="settings-budget__empty">Brak kategorii wydatkowych</p>
          } @else {
            <mat-accordion displayMode="flat">
              <mat-expansion-panel [expanded]="true">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>category</mat-icon>
                    <span>Kategorie wydatków ({{ expenseCategories().length }})</span>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                @for (category of expenseCategories(); track category.id) {
                  <mat-card
                    class="settings-budget__card settings-budget__card--clickable"
                    appearance="outlined"
                    (click)="editCategory(category)"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Edytuj kategorię ' + category.name"
                    (keydown.enter)="editCategory(category)"
                    (keydown.space)="editCategory(category); $event.preventDefault()"
                  >
                    <mat-card-content>
                      <budget-category-card
                        [category]="category"
                        [spending]="agg.categorySpendingMap().get(category.id)"
                        [control]="getCategoryControl(category.id)"
                      />
                    </mat-card-content>
                  </mat-card>
                }
              </mat-expansion-panel>
            </mat-accordion>
          }

          <div class="settings-budget__actions-sticky">
            <div class="settings-budget__actions">
              <button mat-raised-button color="primary" [disabled]="saving()" (click)="onSave()">
                @if (saving()) {
                  <mat-progress-spinner mode="indeterminate" diameter="20" />
                }
                Zapisz
              </button>
            </div>
          </div>
        }
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
  private readonly dialog = inject(MatDialog);

  readonly saving = signal(false);

  readonly categoryForm = new FormRecord<FormControl<number | null>>({});

  // ── Local period state (independent of DashboardState) ──
  readonly periodMode = signal<PeriodMode>('month');
  readonly selectedYear = signal<number>(getCurrentPeriod().year);
  readonly selectedMonth = signal<number>(getCurrentPeriod().month);

  readonly periodLabel = computed(() => {
    const year = this.selectedYear();
    if (this.periodMode() === 'year') {
      return `${year}`;
    }
    const date = new Date(year, this.selectedMonth(), 1);
    return date.toLocaleDateString('pl-PL', {
      month: 'long',
      year: 'numeric',
    });
  });

  readonly canGoNext = computed(() => {
    const now = getCurrentPeriod();
    if (this.periodMode() === 'year') {
      return this.selectedYear() < now.year;
    }
    const y = this.selectedYear();
    const m = this.selectedMonth();
    return y < now.year || (y === now.year && m < now.month);
  });

  readonly canGoPrevious = computed(() => {
    if (this.periodMode() === 'year') {
      return this.selectedYear() > 2020;
    }
    return true;
  });

  goToPrevious(): void {
    if (this.periodMode() === 'year') {
      this.selectedYear.update((y) => y - 1);
    } else {
      const m = this.selectedMonth();
      const y = this.selectedYear();
      if (m === 0) {
        this.selectedMonth.set(11);
        this.selectedYear.set(y - 1);
      } else {
        this.selectedMonth.set(m - 1);
      }
    }
  }

  goToNext(): void {
    const now = getCurrentPeriod();
    if (this.periodMode() === 'year') {
      const nextYear = this.selectedYear() + 1;
      if (nextYear <= now.year) {
        this.selectedYear.set(nextYear);
      }
    } else {
      const m = this.selectedMonth();
      const y = this.selectedYear();
      const nextMonth = m === 11 ? 0 : m + 1;
      const nextYear = m === 11 ? y + 1 : y;

      if (nextYear < now.year || (nextYear === now.year && nextMonth <= now.month)) {
        this.selectedMonth.set(nextMonth);
        this.selectedYear.set(nextYear);
      }
    }
  }

  onModeChange(mode: PeriodMode): void {
    this.periodMode.set(mode);
  }

  // ── Period-based computed values ──

  /** Is the selected period the current month? */
  readonly isCurrentPeriod = computed(() => {
    const now = getCurrentPeriod();
    return (
      this.periodMode() === 'month' &&
      this.selectedYear() === now.year &&
      this.selectedMonth() === now.month
    );
  });

  /** Dynamic page title: "Budżet miesięczny" for current month, month name for past months */
  readonly pageTitle = computed(() => {
    if (this.isCurrentPeriod()) {
      return 'Budżet miesięczny';
    }

    const year = this.selectedYear();
    const month = this.selectedMonth();
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('pl-PL', {
      month: 'long',
      year: 'numeric',
    });
  });

  /** Expenses in the selected period (current or historical month/year) */
  readonly selectedPeriodSpent = computed(() => {
    const txs = this.transactionsResource.value() ?? [];
    const year = this.selectedYear();
    const mode = this.periodMode();

    if (mode === 'year') {
      return txs
        .filter((tx) => {
          const d = new Date(tx.date);
          return tx.amount < 0 && d.getFullYear() === year;
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }

    const month = this.selectedMonth();
    return txs
      .filter((tx) => tx.amount < 0 && isInMonth(tx.date, year, month))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  });

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
    effect(() => {
      this.agg.currentMonthSpent.set(this.selectedPeriodSpent());
    });
    effect(() => {
      this.agg.selectedPeriod.set({
        year: this.selectedYear(),
        month: this.selectedMonth(),
        mode: this.periodMode(),
      });
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
    const prev = this.agg.selectedPreviousPeriodSummary();
    if (!prev) {return;}
    for (const cat of prev.categorySummaries) {
      this.getCategoryControl(cat.categoryId).setValue(cat.limit > 0 ? cat.limit : 0);
    }
  }

  async editCategory(category: Category): Promise<void> {
    const dialogRef = this.dialog.open<
      CategoryEditDialogComponent,
      { category: Category },
      CategoryEditDialogResult | undefined
    >(CategoryEditDialogComponent, {
      data: { category },
      width: '480px',
      maxWidth: '95vw',
    });

    const result = await new Promise<CategoryEditDialogResult | undefined>(
      (resolve) => {
        dialogRef.afterClosed().subscribe(resolve);
      },
    );

    if (!result) {
      return;
    }

    if (result.action === 'save') {
      this.snackBar.open(
        `Zapisano zmiany dla kategorii "${result.category.name}".`,
        undefined,
        { duration: 3000 },
      );
      this.categoriesResource.reload();
      this.budgetState.reload();
    } else if (result.action === 'delete') {
      this.snackBar.open('Usunięto kategorię.', undefined, { duration: 3000 });
      this.categoriesResource.reload();
      this.budgetState.reload();
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

      const categories = this.expenseCategories();
      for (const cat of categories) {
        const limit: number | null | undefined = formValues[cat.id];
        if (limit !== null && limit !== undefined && limit > 0) {
          await this.categoryBudgetService.save(cat.id, cat.name, limit);
        } else if (existingMap.has(cat.id)) {
          await this.categoryBudgetService.deleteByCategoryId(cat.id);
        }
      }

      this.budgetState.reload();
      this.snackBar.open('Zapisano limity budżetu.', undefined, { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  /** Only show expense categories for budget limits (treat missing transactionType as expense). */
  readonly expenseCategories = computed(() => {
    const cats = this.categoriesResource.value() ?? [];
    return cats.filter((c) => (c.transactionType ?? 'expense') === 'expense');
  });

  protected readonly categories = this.categoriesResource.value;
}