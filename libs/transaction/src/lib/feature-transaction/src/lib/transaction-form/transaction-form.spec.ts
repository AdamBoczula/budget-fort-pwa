import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TransactionFormComponent } from './transaction-form';
import { Category, CategoryService, SubcategoryService, Transaction } from '@data-access-transaction';

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
  const anotherExpenseCategory: Category = {
    id: 'transport', name: 'Transport', colorHex: '#0EA5E9', icon: 'directions_car',
    sortOrder: 20, isHidden: false,
    createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  };
  const mockService = {
    getVisibleCategories: () => of([expenseCategory, anotherExpenseCategory, incomeCategory]),
    getCategories: () => of([expenseCategory, anotherExpenseCategory, incomeCategory]),
    getCategoriesAsync: () => Promise.resolve([expenseCategory, anotherExpenseCategory, incomeCategory]),
  };
  const mockSubcategoryService = {
    getSubcategoriesAsync: () => Promise.resolve([]),
    upsertSubcategoryAsync: () => Promise.resolve(),
  };
  const mockDialogRef = { close: () => void 0, afterClosed: () => of(undefined) };

  const renderForm = (category: Category) =>
    render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { category } },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
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
        { provide: SubcategoryService, useValue: mockSubcategoryService },
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
        { provide: SubcategoryService, useValue: mockSubcategoryService },
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

  it('should save with subcategory', async () => {
    const closeSpy = vi.fn();
    const user = userEvent.setup();
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy, afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
      ],
    });
    await user.clear(screen.getByLabelText('Kwota'));
    await user.type(screen.getByLabelText('Kwota'), '42.50');
    await user.type(screen.getByLabelText('Podkategoria (opcjonalna)'), 'Naprawa');
    await user.click(screen.getByRole('button', { name: /Zapisz/i }));
    expect(closeSpy).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'food', amount: -42.50, subcategory: 'Naprawa',
    }));
  });

  it('should filter subcategories by query ignoring case and spaces', async () => {
    const { fixture } = await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn(), afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
        {
          provide: SubcategoryService,
          useValue: {
            getSubcategoriesAsync: () => Promise.resolve([
              { id: 's1', categoryId: 'food', name: 'buty' },
              { id: 's2', categoryId: 'food', name: 'bluzy' },
              { id: 's3', categoryId: 'food', name: 'kurtka puchowa' },
            ]),
            upsertSubcategoryAsync: () => Promise.resolve(),
          },
        },
      ],
    });
    const component = fixture.componentInstance;
    const subcategoryInput = screen.getByLabelText('Podkategoria (opcjonalna)');

    // Czekamy aż resource załaduje podkategorie
    await vi.waitFor(() => {
      expect(component.subcategories.status()).toBe('resolved');
    }, { timeout: 3000 });

    const user = userEvent.setup();
    const filterFor = async (query: string): Promise<string[]> => {
      await user.clear(subcategoryInput);
      if (query) {
        await user.type(subcategoryInput, query);
      }
      return component.filteredSubcategories().map((s) => s.name);
    };

    // Po wpisaniu 'uz' powinny pasować 'bluzy' (zawiera 'uz')
    await expect(filterFor('uz')).resolves.toEqual(['bluzy']);

    // Po wpisaniu 'but' powinny pasować 'buty'
    await expect(filterFor('but')).resolves.toEqual(['buty']);

    // Po wpisaniu 'y' powinny pasować 'buty' i 'bluzy'
    await expect(filterFor('y')).resolves.toEqual(['buty', 'bluzy']);

    // Po wpisaniu 'kurtkap' (ignorując spacje 'kurtka puchowa' -> 'kurtkapuchowa') powinna pasować 'kurtka puchowa'
    await expect(filterFor('kurtkap')).resolves.toEqual(['kurtka puchowa']);

    // Po pustym zapytaniu wszystkie
    await expect(filterFor('')).resolves.toHaveLength(3);
  });

  it('should show only expense categories in menu when expense category is selected', async () => {
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn(), afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
      ],
    });
    await screen.findByText('Jedzenie');
    const changeBtn = screen.getByLabelText('Zmień kategorię');
    await userEvent.setup().click(changeBtn);
    // Menu powinno zawierać expense categories, ale nie income
    const menuItems = screen.getAllByRole('menuitem');
    const menuTexts = menuItems.map((item) => item.textContent?.trim());
    expect(menuTexts).not.toContain('Zarobek');
    expect(menuTexts.some((t) => t?.includes('Jedzenie'))).toBe(true);
  });

  it('should show only income categories in menu when income category is selected', async () => {
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn(), afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: incomeCategory } },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
      ],
    });
    await screen.findByText('Zarobek');
    const changeBtn = screen.getByLabelText('Zmień kategorię');
    await userEvent.setup().click(changeBtn);
    const menuItems = screen.getAllByRole('menuitem');
    const menuTexts = menuItems.map((item) => item.textContent?.trim());
    expect(menuTexts).not.toContain('Jedzenie');
    expect(menuTexts.some((t) => t?.includes('Zarobek'))).toBe(true);
  });

  it('should close dialog on cancel', async () => {
    const closeSpy = vi.fn();
    const user = userEvent.setup();
    await render(TransactionFormComponent, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy, afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: { category: expenseCategory } },
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
      ],
    });
    await user.click(screen.getByRole('button', { name: /Anuluj/i }));
    expect(closeSpy).toHaveBeenCalledWith();
  });

  describe('edit mode dirty check', () => {
    const existingTransaction: Transaction = {
      id: 'tx-1',
      amount: -42.5,
      date: new Date(2026, 7, 15, 12, 0, 0).toISOString(),
      categoryId: 'food',
      accountId: 'default',
      comment: 'Lunch',
    };

    const renderEditForm = () =>
      render(TransactionFormComponent, {
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { category: expenseCategory, transaction: existingTransaction },
          },
          { provide: CategoryService, useValue: mockService },
          { provide: SubcategoryService, useValue: mockSubcategoryService },
        ],
      });

    it('should disable save button when no changes are made in edit mode', async () => {
      await renderEditForm();
      expect(screen.getByRole('button', { name: /Zapisz/i })).toBeDisabled();
    });

    it('should enable save button when amount is changed', async () => {
      const user = userEvent.setup();
      await renderEditForm();
      await user.clear(screen.getByLabelText('Kwota'));
      await user.type(screen.getByLabelText('Kwota'), '99.99');
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();
    });

    it('should enable save button when comment is changed', async () => {
      const user = userEvent.setup();
      await renderEditForm();
      await user.type(screen.getByLabelText('Komentarz (opcjonalny)'), ' changed');
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();
    });

    it('should enable save button when subcategory is changed', async () => {
      const user = userEvent.setup();
      await renderEditForm();
      await user.type(screen.getByLabelText('Podkategoria (opcjonalna)'), ' Nowa');
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();
    });

    it('should enable save button when category is changed', async () => {
      const user = userEvent.setup();
      await renderEditForm();
      await user.click(screen.getByLabelText('Zmień kategorię'));
      await user.click(screen.getByRole('menuitem', { name: /Transport/i }));
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();
    });

    it('should enable save button when date is changed', async () => {
      const { fixture } = await renderEditForm();
      const component = fixture.componentInstance;
      component.selectedDate = new Date(2026, 7, 14); // different day
      fixture.detectChanges();
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();
    });

    it('should disable save again when changes are reverted', async () => {
      const user = userEvent.setup();
      await renderEditForm();
      await user.clear(screen.getByLabelText('Kwota'));
      await user.type(screen.getByLabelText('Kwota'), '99.99');
      expect(screen.getByRole('button', { name: /Zapisz/i })).not.toBeDisabled();

      await user.clear(screen.getByLabelText('Kwota'));
      await user.type(screen.getByLabelText('Kwota'), '42.50');
      expect(screen.getByRole('button', { name: /Zapisz/i })).toBeDisabled();
    });
  });
});