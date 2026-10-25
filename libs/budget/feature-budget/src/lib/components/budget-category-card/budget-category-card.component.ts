// spec: docs/specs/budget/planowanie-budzetu.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, input } from '@angular/core';
import type { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import type { Category } from '@data-access-transaction';
import type { CategorySpendingSummary } from '../../services/budget-aggregation.service';
import { CurrencyService } from '@currency';

@Component({
  selector: 'budget-category-card',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="category-card">
      <div class="category-card__row">
        <div class="category-card__name">
          <mat-icon class="category-card__icon">{{ category().icon }}</mat-icon>
          <span class="category-card__label">{{ category().name }}</span>
        </div>

        @if (spending(); as catSpending) {
          <div class="category-card__history">
            <span class="category-card__history-label">Poprzedni miesiąc:</span>
            <span class="category-card__history-values">
              <span
                class="category-card__history-spent"
                [class.category-card__history-spent--over]="catSpending.isOverLimit"
                [class.category-card__history-spent--under]="!catSpending.isOverLimit"
              >
                {{ catSpending.spentFormatted }}
              </span>
              <span class="category-card__history-limit"> / {{ catSpending.limitFormatted }}</span>
            </span>
          </div>
        }
      </div>

      <mat-form-field appearance="outline" class="category-card__field">
        <mat-label>Limit</mat-label>
        <input
          matInput
          type="number"
          min="0"
          step="1"
          [attr.aria-label]="'Limit dla ' + category().name"
          [formControl]="control()"
        />
        <span matTextSuffix>{{ currencySymbol }}</span>
        @if (control().hasError('min')) {
          <mat-error>Limit nie może być ujemny</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  styleUrl: './budget-category-card.component.scss',
})
export class BudgetCategoryCardComponent {
  private readonly currencyService = inject(CurrencyService);

  readonly category = input.required<Category>();
  readonly spending = input<CategorySpendingSummary>();
  readonly control = input.required<FormControl<number | null>>();

  protected readonly currencySymbol = this.currencyService.getSymbol();
}
