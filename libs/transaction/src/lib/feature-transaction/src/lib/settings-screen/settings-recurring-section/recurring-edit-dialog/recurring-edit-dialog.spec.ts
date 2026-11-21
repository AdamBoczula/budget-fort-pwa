// spec: docs/specs/transaction/recurring-transactions.md

import { render, screen } from '@testing-library/angular';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService, RecurringTransactionRule } from '@data-access-transaction';
import { RecurringEditDialogComponent } from './recurring-edit-dialog';

describe('RecurringEditDialogComponent', () => {
  const mockCategoryService = {
    getCategoriesAsync: vi
      .fn()
      .mockResolvedValue([
        { id: 'housing', name: 'Mieszkanie', colorHex: '#3b82f6', icon: 'home' },
      ]),
  };

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should prefill dayOfMonth with the current day when creating a new rule', async () => {
    await render(RecurringEditDialogComponent, {
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });

    const dayInput = screen.getByTestId('recurring-dialog-day');
    expect(dayInput).toHaveValue(new Date().getDate());
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should keep existing rule dayOfMonth when editing a rule', async () => {
    const existingRule: RecurringTransactionRule = {
      id: 'rule-1',
      amount: 100,
      categoryId: 'housing',
      accountId: 'default',
      dayOfMonth: 5,
      startDate: '2026-01-01',
      lastGeneratedMonth: '2026-11',
      isActive: true,
      updatedAt: '2026-11-01T00:00:00.000Z',
    };

    await render(RecurringEditDialogComponent, {
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { rule: existingRule } },
      ],
    });

    const dayInput = screen.getByTestId('recurring-dialog-day');
    expect(dayInput).toHaveValue(5);
  });
});
