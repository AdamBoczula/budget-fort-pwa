// spec: docs/specs/budget/planowanie-budzetu.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BudgetProgressBarComponent } from '@ui-budget';
import { CurrencyService } from '@currency';

@Component({
  selector: 'budget-current-month-card',
  imports: [CommonModule, BudgetProgressBarComponent, MatIconModule],
  template: `
    <div class="current-month-card">
      <div class="current-month-card__header">
        <mat-icon class="current-month-card__header-icon">today</mat-icon>
        <span class="current-month-card__header-text">Bieżący miesiąc</span>
      </div>

      <budget-progress-bar
        class="current-month-card__progress"
        [spent]="spent()"
        [limit]="limit()"
      />

      <div class="current-month-card__totals">
        <span class="current-month-card__label">Wydano</span>
        <span
          class="current-month-card__value"
          [class.current-month-card__value--under]="percentage() < 80"
          [class.current-month-card__value--warn]="percentage() >= 80 && percentage() < 100"
          [class.current-month-card__value--over]="percentage() >= 100"
        >
          {{ formatInteger(spent()) }} {{ currencySymbol }}
        </span>
        <span class="current-month-card__separator">/</span>
        <span class="current-month-card__label">Zaplanowano</span>
        <span class="current-month-card__limit">{{ formatInteger(limit()) }} {{ currencySymbol }}</span>
      </div>

      <div class="current-month-card__summary">
        Suma limitów kategorii: <strong>{{ formatInteger(limit()) }} {{ currencySymbol }}</strong>
      </div>
    </div>
  `,
  styleUrl: './budget-current-month-card.component.scss',
})
export class BudgetCurrentMonthCardComponent {
  private readonly currencyService = inject(CurrencyService);

  readonly spent = input.required<number>();
  readonly limit = input.required<number>();
  readonly percentage = input.required<number>();

  protected readonly currencySymbol = this.currencyService.getSymbol();

  protected formatInteger(value: number): string {
    return new Intl.NumberFormat(this.currencyService.currentLocale(), {
      maximumFractionDigits: 0,
    }).format(value);
  }
}
