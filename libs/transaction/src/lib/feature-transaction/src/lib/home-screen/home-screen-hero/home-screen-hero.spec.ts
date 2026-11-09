// spec: docs/specs/budget/redesign-home-minimalist.md

import { render, screen } from '@testing-library/angular';
import { LOCALE_ID } from '@angular/core';
import { BudgetService, CategoryBudgetService } from '@data-access-budget';
import { TransactionState } from '../../service/transaction-state/transaction-state';
import { HomeScreenHeroComponent } from './home-screen-hero';

describe('HomeScreenHeroComponent', () => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 2, 12).toISOString();
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 2, 12).toISOString();

  async function setup(opts: { budget?: number; categoryBudgets?: number[] }): Promise<void> {
    await render(HomeScreenHeroComponent, {
      providers: [
        { provide: LOCALE_ID, useValue: 'pl' },
        {
          provide: TransactionState,
          useValue: {
            transactions: () => [
              { id: '1', amount: -100.5, date: thisMonth, categoryId: 'a' },
              { id: '2', amount: -50, date: thisMonth, categoryId: 'a' },
              { id: '3', amount: 900, date: thisMonth, categoryId: 'b' },
              { id: '4', amount: -999, date: lastYear, categoryId: 'a' },
            ],
          },
        },
        {
          provide: BudgetService,
          useValue: {
            getBudget: () =>
              Promise.resolve(opts.budget ? { id: 1, amount: opts.budget } : undefined),
          },
        },
        {
          provide: CategoryBudgetService,
          useValue: {
            getAll: () =>
              Promise.resolve((opts.categoryBudgets ?? []).map((amount) => ({ amount }))),
          },
        },
      ],
    });
  }

  // covers: docs/specs/budget/redesign-home-minimalist.md#AC-1
  it('shows current month expenses only (no income, no other months)', async () => {
    await setup({});
    expect((await screen.findByTestId('hero-amount')).textContent).toContain('150');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  // covers: docs/specs/budget/redesign-home-minimalist.md#AC-1
  it('renders progress against the overall budget', async () => {
    await setup({ budget: 1000 });
    const bar = await screen.findByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('15');
    expect(screen.getByTestId('hero-limit').textContent).toContain('1');
  });

  // covers: docs/specs/budget/redesign-home-minimalist.md#AC-1
  it('falls back to the sum of category limits', async () => {
    await setup({ categoryBudgets: [100, 100] });
    const bar = await screen.findByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
  });
});
