import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { LastTransactionItemComponent } from './last-transaction-item';
import { Category, Transaction } from '@data-access-transaction';

describe('LastTransactionItemComponent', () => {
  beforeAll(() => {
    registerLocaleData(localePl);
  });

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

  const expenseTransaction: Transaction = {
    id: 'tx-1',
    amount: -42.5,
    date: new Date(2026, 7, 15, 12, 0, 0).toISOString(),
    categoryId: 'food',
    accountId: 'default',
    comment: 'Lunch',
  };

  const incomeTransaction: Transaction = {
    id: 'tx-2',
    amount: 100,
    date: new Date(2026, 7, 16, 12, 0, 0).toISOString(),
    categoryId: 'income',
    accountId: 'default',
  };

  it('should render category name and icon', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    expect(screen.getByTestId('last-transaction-item__name')).toHaveTextContent('Jedzenie');
    const icon = screen.getByTestId('last-transaction-item__icon');
    expect(icon.querySelector('mat-icon')).toHaveTextContent('restaurant');
  });

  it('should render icon background color based on category', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    const icon = screen.getByTestId('last-transaction-item__icon');
    expect(icon.style.backgroundColor).toBe('rgb(22, 163, 74)');
  });

  it('should display comment when present', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    expect(screen.getByTestId('last-transaction-item__comment')).toHaveTextContent('Lunch');
  });

  it('should display subcategory when present', async () => {
    const txWithSubcategory = { ...expenseTransaction, subcategory: 'Biedronka' };
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: txWithSubcategory, category: expenseCategory },
    });
    const nameEl = screen.getByTestId('last-transaction-item__name');
    expect(nameEl.textContent).toContain('Biedronka');
  });

  it('should not display comment when absent', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: incomeTransaction, category: incomeCategory },
    });
    expect(screen.queryByTestId('last-transaction-item__comment')).toBeNull();
  });

  it('should format expense with minus sign', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    const amount = screen.getByTestId('last-transaction-item__amount');
    expect(amount.textContent).toContain('-');
  });

  it('should format income without minus and apply income class', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: incomeTransaction, category: incomeCategory },
    });
    const amount = screen.getByTestId('last-transaction-item__amount');
    expect(amount.textContent).not.toContain('-');
    expect(amount.classList.contains('income')).toBe(true);
  });

  it('should render date formatted as dd.MM.yyyy', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    expect(screen.getByTestId('last-transaction-item__date')).toHaveTextContent('15.08.2026');
  });

  it('should emit edit event on edit button click', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    const spy = vi.fn();
    fixture.componentInstance.edit.subscribe(spy);
    await user.click(screen.getByTestId('last-transaction-item__edit-btn'));
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteItem event on delete button click', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction, category: expenseCategory },
    });
    const spy = vi.fn();
    fixture.componentInstance.deleteItem.subscribe(spy);
    await user.click(screen.getByTestId('last-transaction-item__delete-btn'));
    expect(spy).toHaveBeenCalled();
  });

  it('should render fallback when category is missing', async () => {
    await render(LastTransactionItemComponent, {
      componentInputs: { transaction: expenseTransaction },
    });
    expect(screen.getByTestId('last-transaction-item__name')).toHaveTextContent('—');
    const icon = screen.getByTestId('last-transaction-item__icon');
    expect(icon.querySelector('mat-icon')).toHaveTextContent('category');
    expect(icon.style.backgroundColor).toBe('rgb(107, 114, 128)');
  });
});
