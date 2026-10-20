// spec: docs/specs/budget/planowanie-budzetu.md

import { Component, computed, input } from '@angular/core';
import { getProgressColor } from '../utils/progress-color-utils';

@Component({
  selector: 'budget-progress-bar',
  imports: [],
  templateUrl: './budget-progress-bar.component.html',
  styleUrl: './budget-progress-bar.component.scss',
})
export class BudgetProgressBarComponent {
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

  protected readonly formattedSpent = computed(() => this.spent().toFixed(0));

  protected readonly formattedLimit = computed(() => this.limit().toFixed(0));
}
