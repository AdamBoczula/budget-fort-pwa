// spec: docs/specs/budget/planowanie-budzetu.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, computed, inject, input } from '@angular/core';
import { CurrencyService } from '@currency';
import { getProgressColor, getProgressGradient } from '../utils/progress-color-utils';

@Component({
  selector: 'budget-progress-bar',
  imports: [],
  templateUrl: './budget-progress-bar.component.html',
  styleUrl: './budget-progress-bar.component.scss',
})
export class BudgetProgressBarComponent {
  private readonly currencyService = inject(CurrencyService);

  readonly spent = input.required<number>();
  readonly limit = input.required<number>();
  readonly label = input<string>();

  protected readonly percentage = computed(() => {
    const limitValue = this.limit();
    const spentValue = Math.abs(this.spent());
    if (limitValue <= 0) {
      return 0;
    }
    const pct = Math.round((spentValue / limitValue) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  protected readonly color = computed(() => getProgressColor(this.percentage()));

  protected readonly showZeroLimit = computed(() => this.limit() <= 0);

  protected readonly gradientStyle = computed(() => {
    if (this.showZeroLimit()) {
      return '';
    }
    return getProgressGradient(this.percentage());
  });

  protected readonly formattedSpent = computed(() =>
    new Intl.NumberFormat(this.currencyService.currentLocale(), {
      maximumFractionDigits: 0,
    }).format(Math.abs(this.spent())),
  );

  protected readonly formattedLimit = computed(() =>
    new Intl.NumberFormat(this.currencyService.currentLocale(), {
      maximumFractionDigits: 0,
    }).format(this.limit()),
  );

  protected readonly currencySymbol = this.currencyService.getSymbol();
}