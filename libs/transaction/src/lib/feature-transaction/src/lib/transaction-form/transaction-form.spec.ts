import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TransactionFormComponent } from './transaction-form';
import { Category, CategoryService } from '@data-access-transaction';

describe('TransactionFormComponent', () => {
  const expenseCategory: Category = {
    id: 'food', name: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant',
    sortOrder: 10, isHidden: false,
    createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  };
  const incomeCategory: Category = {
    id: 'income', name: 'Zarobek', colorHex: '#10B981', icon: 'savings',
    sortOrder: 5, isHidden: false, transactionType: 'income',
    createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  };
  const mockService = {
    getVisibleCategories: () => of([expenseCategory, incomeCategory]),
    getCategories: () => of([expenseCategory, incomeCategory]),
    getVisibleCategoriesAsync: () => Promise.resolve([expenseCategory, incomeCategory]),
  };
  const mockDialogRef = { close: () => void 0, afterClosed: () => of(undefined) };

  const renderForm = (category: Category) =>
    render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { category } },
        { provide: CategoryService, useValue: mockService },
      ],
    });

  it('should render category name and amount field', async () => {
    await renderForm(expenseCategory);
    expect(screen.getByText('Jedzenie')).toBeInTheDocument();
    expect(screen.getByLabelText('Kwota')).toBeInTheDocument();
    expect(screen.getByLabelText('Data')).toBeInTheDocument();
  });

  it('should render income category with savings icon', async () => {
    await renderForm(incomeCategory);
    expect(screen.getByText('Zarobek')).toBeInTheDocument();
    const savingsIcons = document.querySelectorAll('mat-icon');
    const found = Array.from(savingsIcons).find(i => i.textContent?.trim() === 'savings');
    expect(found).toBeDefined();
  });

  it('should save expense with negative amount', async () => {
    const closeSpy = vi.fn();
    const user = userEvent.setup();
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy, afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
      ],
    });
    await user.clear(screen.getByLabelText('Kwota'));
    await user.type(screen.getByLabelText('Kwota'), '42.50');
    await user.click(screen.getByRole('button', { name: /Zapisz/i }));
    expect(closeSpy).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'food', amount: -42.50, type: 'expense',
    }));
  });

  it('should save income with positive amount', async () => {
    const closeSpy = vi.fn();
    const user = userEvent.setup();
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy, afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: incomeCategory } },
        { provide: CategoryService, useValue: mockService },
      ],
    });
    await user.clear(screen.getByLabelText('Kwota'));
    await user.type(screen.getByLabelText('Kwota'), '100');
    await user.click(screen.getByRole('button', { name: /Zapisz/i }));
    expect(closeSpy).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'income', amount: 100, type: 'income',
    }));
  });

  it('should disable save button when amount is empty', async () => {
    await renderForm(expenseCategory);
    expect(screen.getByRole('button', { name: /Zapisz/i })).toBeDisabled();
  });

  it('should close dialog on cancel', async () => {
    const closeSpy = vi.fn();
    const user = userEvent.setup();
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy, afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
      ],
    });
    await user.click(screen.getByRole('button', { name: /Anuluj/i }));
    expect(closeSpy).toHaveBeenCalledWith();
  });
});