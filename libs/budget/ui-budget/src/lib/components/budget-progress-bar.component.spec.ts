// spec: docs/specs/budget/planowanie-budzetu.md

import { render, screen } from '@testing-library/angular';
import { BudgetProgressBarComponent } from './budget-progress-bar.component';

describe('BudgetProgressBarComponent', () => {
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  it('should display green bar for usage below 80%', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 2000, limit: 5000, label: 'Budżet ogólny' },
    });

    expect(screen.getByText('Budżet ogólny')).toBeInTheDocument();
    expect(screen.getByText(/2000 \/ 5000 zł/i)).toBeInTheDocument();
    expect(screen.getByText('(40%)')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');

    // Green fill bar should be present
    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar).toBeTruthy();
    expect(fillBar.style.backgroundColor).toBe('rgb(76, 175, 80)'); // #4caf50
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-4
  it('should display yellow bar for usage between 80% and 99%', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 4200, limit: 5000 },
    });

    expect(screen.getByText('(84%)')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar.style.backgroundColor).toBe('rgb(255, 152, 0)'); // #ff9800
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-5
  it('should display red bar for usage at or above 100% and clamp at 100%', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 5200, limit: 5000, label: 'Jedzenie' },
    });

    expect(screen.getByText('(100%)')).toBeInTheDocument();
    expect(screen.getByText(/5200 \/ 5000 zł/i)).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');

    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar.style.backgroundColor).toBe('rgb(244, 67, 54)'); // #f44336
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 1
  it('should show 0% when limit is 0 (no budget set)', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 500, limit: 0 },
    });

    // When limit is 0, percentage is 0, green
    expect(screen.getByText('(0%)')).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 3
  it('should show 0% green when no expenses in current month', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 0, limit: 5000, label: 'Transport' },
    });

    expect(screen.getByText('(0%)')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar.style.backgroundColor).toBe('rgb(76, 175, 80)'); // green
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-6
  it('should render without label when label is not provided', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 1350, limit: 1500 },
    });

    // Label div should not be in the DOM
    const labelEl = document.querySelector('.budget-progress__label');
    expect(labelEl).toBeNull();

    // But the text and percentage should still be visible
    expect(screen.getByText(/1350 \/ 1500 zł/i)).toBeInTheDocument();
    expect(screen.getByText('(90%)')).toBeInTheDocument();
  });
});
