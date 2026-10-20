// spec: docs/specs/budget/planowanie-budzetu.md

import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type {
  PreviousMonthSummary,
  MonthComparison,
} from '../../services/budget-aggregation.service';

@Component({
  selector: 'budget-previous-month-card',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="prev-month-card">
      <div class="prev-month-card__header">
        <mat-icon class="prev-month-card__header-icon">calendar_month</mat-icon>
        <span class="prev-month-card__header-text">{{ summary().monthLabel }}</span>
        <span
          class="prev-month-card__header-badge"
          [class.prev-month-card__header-badge--under]="!overBudget()"
          [class.prev-month-card__header-badge--over]="overBudget()"
        >
          {{ overBudget() ? 'Przekroczony' : 'W budżecie' }}
        </span>
      </div>

      <div class="prev-month-card__totals">
        <span class="prev-month-card__label">Wydano</span>
        <span
          class="prev-month-card__value"
          [class.prev-month-card__value--under]="!overBudget()"
          [class.prev-month-card__value--over]="overBudget()"
        >
          {{ summary().totalSpentFormatted }}
        </span>
        <span class="prev-month-card__separator">/</span>
        <span class="prev-month-card__label">Zaplanowano</span>
        <span class="prev-month-card__limit">{{ summary().budgetLimitFormatted }}</span>
      </div>

      @if (comparison(); as cmp) {
        <div
          class="prev-month-card__comparison"
          [class.prev-month-card__comparison--more]="cmp.isMore"
          [class.prev-month-card__comparison--less]="!cmp.isMore"
        >
          @if (cmp.isMore) {
            <mat-icon class="prev-month-card__comparison-icon">trending_up</mat-icon>
            <span>Wydajesz {{ cmp.pct }}% więcej niż w {{ summary().monthLabel | lowercase }}</span>
          } @else if (cmp.pct < 0) {
            <mat-icon class="prev-month-card__comparison-icon">trending_down</mat-icon>
            <span>Wydajesz {{ -cmp.pct }}% mniej niż w {{ summary().monthLabel | lowercase }}</span>
          } @else {
            <mat-icon class="prev-month-card__comparison-icon">trending_flat</mat-icon>
            <span>Wydajesz tyle samo co w {{ summary().monthLabel | lowercase }}</span>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './budget-previous-month-card.component.scss',
})
export class BudgetPreviousMonthCardComponent {
  readonly summary = input.required<PreviousMonthSummary>();
  readonly comparison = input<MonthComparison | null>();

  protected overBudget = () => this.summary().totalSpent > this.summary().budgetLimit;
}
