// spec: docs/specs/transaction/recurring-transactions.md

import { Component, computed, inject, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Category,
  CategoryService,
  RecurringRuleService,
  RecurringTransactionRule,
} from '@data-access-transaction';
import { CurrencyService } from '@currency';
import {
  RecurringEditDialogComponent,
  RecurringEditDialogData,
} from './recurring-edit-dialog/recurring-edit-dialog';

@Component({
  selector: 'transaction-settings-recurring-section',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <section class="recurring-section" data-testid="settings-recurring-section">
      <div class="recurring-section__header">
        <div class="recurring-section__title-group">
          <div class="recurring-section__title-row">
            <mat-icon class="recurring-section__header-icon">repeat</mat-icon>
            <h2 class="recurring-section__title" i18n="@@settingsRecurring.title">
              Opłaty cykliczne
            </h2>
          </div>
          <p class="recurring-section__subtitle" i18n="@@settingsRecurring.subtitle">
            Zarządzaj stałymi comiesięcznymi wydatkami generowanymi automatycznie.
          </p>
        </div>

        <div class="recurring-section__actions">
          <button
            mat-flat-button
            color="primary"
            (click)="openAddDialog()"
            data-testid="add-recurring-rule-btn"
            i18n="@@settingsRecurring.addBtn"
          >
            <mat-icon>add</mat-icon>
            Dodaj opłatę
          </button>
        </div>
      </div>

      <!-- Sumaryczna kwota -->
      @if (rules().length > 0) {
        <div class="recurring-section__summary" data-testid="recurring-summary">
          <span class="recurring-section__summary-label" i18n="@@settingsRecurring.summaryLabel">
            Suma comiesięcznych opłat:
          </span>
          <span class="recurring-section__summary-amount" data-testid="recurring-total-amount">
            {{ currencyService.format(totalMonthlyAmount()) }}
          </span>
        </div>
      }

      <!-- Lista reguł -->
      @if (rules().length === 0) {
        <div class="recurring-section__empty" data-testid="recurring-empty">
          <mat-icon class="recurring-section__empty-icon">event_repeat</mat-icon>
          <p class="recurring-section__empty-text" i18n="@@settingsRecurring.empty">
            Brak zdefiniowanych opłat stałych. Możesz dodać nową opłatę powyżej lub zaznaczyć opcję
            „Ustaw jako wydatek cykliczny” podczas wpisywania transakcji.
          </p>
        </div>
      } @else {
        <div class="recurring-section__list" data-testid="recurring-list">
          @for (rule of rules(); track rule.id) {
            <div
              class="recurring-item"
              [class.recurring-item--inactive]="!rule.isActive"
              data-testid="recurring-item"
            >
              <div class="recurring-item__main">
                <div
                  class="recurring-item__icon"
                  [style.background-color]="getCategoryColor(rule.categoryId)"
                >
                  <mat-icon>{{ getCategoryIcon(rule.categoryId) }}</mat-icon>
                </div>

                <div class="recurring-item__details">
                  <div class="recurring-item__title-row">
                    <span class="recurring-item__name">
                      {{ rule.comment || categoryMap()[rule.categoryId]?.name || 'Opłata' }}
                    </span>
                    @if (rule.comment && categoryMap()[rule.categoryId]?.name) {
                      <span class="recurring-item__category-badge">
                        {{ categoryMap()[rule.categoryId]?.name }}
                      </span>
                    }
                  </div>

                  <span class="recurring-item__schedule">
                    Każdego {{ rule.dayOfMonth }}. dnia miesiąca
                  </span>
                </div>
              </div>

              <div class="recurring-item__right">
                <span class="recurring-item__amount" data-testid="recurring-item-amount">
                  {{ currencyService.format(rule.amount) }}
                </span>

                <div class="recurring-item__controls">
                  <mat-slide-toggle
                    [checked]="rule.isActive"
                    (toggleChange)="toggleActive(rule)"
                    [matTooltip]="rule.isActive ? 'Wstrzymaj opłatę' : 'Aktywuj opłatę'"
                    data-testid="recurring-item-toggle"
                  />

                  <button
                    mat-icon-button
                    type="button"
                    (click)="openEditDialog(rule)"
                    matTooltip="Edytuj"
                    data-testid="recurring-item-edit"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>

                  <button
                    mat-icon-button
                    type="button"
                    color="warn"
                    (click)="deleteRule(rule)"
                    matTooltip="Usuń"
                    data-testid="recurring-item-delete"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './settings-recurring-section.scss',
})
export class SettingsRecurringSectionComponent {
  private readonly recurringService = inject(RecurringRuleService);
  private readonly categoryService = inject(CategoryService);
  protected readonly currencyService = inject(CurrencyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rulesResource = resource({
    loader: async () => this.recurringService.getRulesAsync(),
  });
  protected readonly categoriesResource = resource({
    loader: async () => this.categoryService.getCategoriesAsync(),
  });

  protected readonly rules = this.recurringService.rules;
  protected readonly totalMonthlyAmount = this.recurringService.totalMonthlyAmount;

  protected readonly categoryMap = computed(() => {
    const list = this.categoriesResource.value() ?? [];
    const map: Record<string, Category> = {};
    for (const c of list) {
      map[c.id] = c;
    }
    return map;
  });

  protected getCategoryColor(categoryId: string): string {
    return this.categoryMap()[categoryId]?.colorHex || '#64748b';
  }

  protected getCategoryIcon(categoryId: string): string {
    return this.categoryMap()[categoryId]?.icon || 'repeat';
  }

  protected openAddDialog(): void {
    const dialogRef = this.dialog.open(RecurringEditDialogComponent, {
      width: '100%',
      maxWidth: '440px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      const ruleId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const currentMonth = nowIso.slice(0, 7);

      const newRule: RecurringTransactionRule = {
        id: ruleId,
        amount: result.amount,
        categoryId: result.categoryId,
        accountId: 'default',
        comment: result.comment,
        dayOfMonth: result.dayOfMonth,
        startDate: nowIso.slice(0, 10),
        lastGeneratedMonth: currentMonth,
        isActive: true,
        updatedAt: nowIso,
      };

      await this.recurringService.addRuleAsync(newRule);
      this.snackBar.open('Dodano opłatę cykliczną.', undefined, { duration: 3000 });
    });
  }

  protected openEditDialog(rule: RecurringTransactionRule): void {
    const dialogRef = this.dialog.open(RecurringEditDialogComponent, {
      data: { rule } as RecurringEditDialogData,
      width: '100%',
      maxWidth: '440px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      const updated: RecurringTransactionRule = {
        ...rule,
        amount: result.amount,
        categoryId: result.categoryId,
        dayOfMonth: result.dayOfMonth,
        comment: result.comment,
        updatedAt: new Date().toISOString(),
      };

      await this.recurringService.updateRuleAsync(updated);
      this.snackBar.open('Zaktualizowano opłatę cykliczną.', undefined, { duration: 3000 });
    });
  }

  protected async toggleActive(rule: RecurringTransactionRule): Promise<void> {
    await this.recurringService.toggleRuleActiveAsync(rule.id);
  }

  protected async deleteRule(rule: RecurringTransactionRule): Promise<void> {
    await this.recurringService.deleteRuleAsync(rule.id);
    this.snackBar.open('Usunięto opłatę cykliczną.', undefined, { duration: 3000 });
  }
}
