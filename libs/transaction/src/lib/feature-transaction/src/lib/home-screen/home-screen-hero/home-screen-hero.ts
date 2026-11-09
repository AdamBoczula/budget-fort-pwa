// spec: docs/specs/budget/redesign-home-minimalist.md

import { Component, computed, inject, LOCALE_ID, resource } from '@angular/core';
import { BudgetService, CategoryBudgetService } from '@data-access-budget';
import { CurrencyService } from '@currency';
import { TransactionState } from '../../service/transaction-state/transaction-state';
import { roundHalfUp } from '../../service/dashboard-utils/money-utils';

/**
 * Hero card at the top of Home: current month, amount spent and
 * (optionally) progress against the monthly limit.
 */
@Component({
  selector: 'transaction-home-screen-hero',
  template: `
    <section class="hero" aria-labelledby="hero-month">
      <p id="hero-month" class="hero__month">{{ monthLabel() }}</p>
      <p class="hero__caption" i18n="@@homeHero.spent">Wydano w tym miesiącu</p>
      <p class="hero__amount" data-testid="hero-amount">{{ currencyService.format(spent()) }}</p>

      @if (limit() > 0) {
        <div
          class="hero__progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="percentage()"
        >
          <div
            class="hero__progress-fill"
            [class.hero__progress-fill--over]="isOverLimit()"
            [style.width.%]="percentage()"
          ></div>
        </div>
        <p class="hero__limit" data-testid="hero-limit">
          <span i18n="@@homeHero.limitOf">z limitu</span>
          {{ currencyService.format(limit()) }}
        </p>
      }
    </section>
  `,
  styleUrl: './home-screen-hero.scss',
})
export class HomeScreenHeroComponent {
  protected readonly currencyService = inject(CurrencyService);
  private readonly transactionState = inject(TransactionState);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryBudgetService = inject(CategoryBudgetService);
  private readonly localeId = inject(LOCALE_ID);

  /** Monthly limit: overall budget, or sum of category limits as a fallback. */
  private readonly limitResource = resource({
    loader: async () => {
      const budget = await this.budgetService.getBudget();
      if (budget && budget.amount > 0) {
        return budget.amount;
      }
      const categoryBudgets = await this.categoryBudgetService.getAll();
      return categoryBudgets.reduce((sum, cb) => sum + Math.max(0, cb.amount), 0);
    },
  });

  protected readonly limit = computed(() => this.limitResource.value() ?? 0);

  protected readonly monthLabel = computed(() => {
    const now = new Date();
    const label = now.toLocaleDateString(this.localeId, { month: 'long', year: 'numeric' });
    return label.charAt(0).toLocaleUpperCase(this.localeId) + label.slice(1);
  });

  protected readonly spent = computed(() => {
    const now = new Date();
    const total = this.transactionState
      .transactions()
      .filter((tx) => {
        const d = new Date(tx.date);
        return (
          tx.amount < 0 && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return roundHalfUp(total, 2);
  });

  protected readonly percentage = computed(() => {
    const limit = this.limit();
    if (limit <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((this.spent() / limit) * 100)));
  });

  protected readonly isOverLimit = computed(() => this.limit() > 0 && this.spent() > this.limit());
}
