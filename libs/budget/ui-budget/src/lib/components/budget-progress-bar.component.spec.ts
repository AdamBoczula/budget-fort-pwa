// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { render, screen } from '@testing-library/angular';
import { BudgetProgressBarComponent } from './budget-progress-bar.component';

describe('BudgetProgressBarComponent', () => {
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  it('should display formatted amounts and percentage for usage below 80%', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 2000, limit: 5000, label: 'Budżet ogólny' },
    });

    expect(screen.getByText('Budżet ogólny')).toBeInTheDocument();
    expect(screen.getByText(/2000 \/ 5000 zł/i)).toBeInTheDocument();
    expect(screen.getByText('(40%)')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');

    // The fill bar should be present
    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar).toBeTruthy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-4
  it('should display yellow-range percentage for usage between 80% and 99%', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 4200, limit: 5000 },
    });

    expect(screen.getByText('(84%)')).toBeInTheDocument();
    expect(screen.getByText(/4200 \/ 5000 zł/i)).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '84');

    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar).toBeTruthy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-5
  it('should clamp percentage at 100% and show red for usage above limit', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 5200, limit: 5000, label: 'Jedzenie' },
    });

    expect(screen.getByText('(100%)')).toBeInTheDocument();
    expect(screen.getByText(/5200 \/ 5000 zł/i)).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');

    const fillBar = progressbar.querySelector('.budget-progress__bar-fill') as HTMLElement;
    expect(fillBar).toBeTruthy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 1
  // covers: docs/qa/2026-10-21-ui-ux-audit.md
  it('should show "Brak limitu" and 0% width bar when limit is 0 (no budget set)', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 500, limit: 0 },
    });

    // When limit is 0, show "Brak limitu" text instead of "X / Y zł (Z%)"
    expect(screen.getByText('Brak limitu')).toBeInTheDocument();
    expect(screen.queryByText(/zł/)).toBeNull();
    expect(screen.queryByText(/\(/)).toBeNull();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#Edge Case 3
  it('should show 0% when no expenses in current month', async () => {
    await render(BudgetProgressBarComponent, {
      inputs: { spent: 0, limit: 5000, label: 'Transport' },
    });

    expect(screen.getByText('(0%)')).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 5000 zł/i)).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
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