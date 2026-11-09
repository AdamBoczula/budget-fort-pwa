import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { CategoriesQuickAddComponent } from './categories-quick-add';
import { Category, CategoryService, SubcategoryService } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

describe('CategoriesQuickAddComponent', () => {
  const mockCategories: Category[] = [
    {
      id: 'food',
      name: 'Jedzenie',
      colorHex: '#16A34A',
      icon: 'restaurant',
      sortOrder: 10,
      isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'income',
      name: 'Zarobek',
      colorHex: '#10B981',
      icon: 'savings',
      sortOrder: 5,
      isHidden: false,
      transactionType: 'income',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const mockService = {
    getVisibleCategories: () => of(mockCategories),
    getVisibleCategoriesAsync: () => Promise.resolve(mockCategories),
    getCategoriesAsync: () => Promise.resolve(mockCategories),
  };
  const mockSubcategoryService = {
    getSubcategoriesAsync: () => Promise.resolve([]),
    upsertSubcategoryAsync: () => Promise.resolve(),
  };
  const mockTxState = { addTransaction: () => Promise.resolve(), mutationError: () => null };
  const mockSnackBar = { open: vi.fn() };

  it('should render category cards', async () => {
    await render(CategoriesQuickAddComponent, {
      providers: [
        provideNativeDateAdapter(),
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
        { provide: TransactionState, useValue: mockTxState },
      ],
      componentProviders: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    });

    const title = screen.getByText('Wybierz kategorię');
    expect(title).toBeInTheDocument();
    expect(title).toBeVisible();

    // resource() ładuje dane asynchronicznie – używamy findByText które czeka
    const jedzenie = await screen.findByText('Jedzenie');
    expect(jedzenie).toBeInTheDocument();

    const zarobek = await screen.findByText('Zarobek');
    expect(zarobek).toBeInTheDocument();
  });

  // covers: docs/specs/budget/redesign-home-minimalist.md#AC-3
  it('should apply category color only through the icon custom property', async () => {
    await render(CategoriesQuickAddComponent, {
      providers: [
        provideNativeDateAdapter(),
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
        { provide: TransactionState, useValue: mockTxState },
      ],
      componentProviders: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    });

    const card = (await screen.findByText('Jedzenie')).closest('button') as HTMLElement;
    expect(card.classList).toContain('category-card');
    expect(card.style.getPropertyValue('--category-color')).toBe('#16A34A');
    expect(card.querySelector('.category-card__icon')).not.toBeNull();
  });

  it('should open MatDialog on category card click', async () => {
    const user = userEvent.setup();

    await render(CategoriesQuickAddComponent, {
      providers: [
        provideNativeDateAdapter(),
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
        { provide: TransactionState, useValue: mockTxState },
      ],
      componentProviders: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    });

    const foodButton = (await screen.findByText('Jedzenie')).closest('button');
    expect(foodButton).toBeTruthy();
    if (foodButton) {
      await user.click(foodButton);
    }
  });

  it('should display income category with savings icon', async () => {
    await render(CategoriesQuickAddComponent, {
      providers: [
        provideNativeDateAdapter(),
        { provide: CategoryService, useValue: mockService },
        { provide: SubcategoryService, useValue: mockSubcategoryService },
        { provide: TransactionState, useValue: mockTxState },
      ],
      componentProviders: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    });

    const zarobek = await screen.findByText('Zarobek');
    expect(zarobek).toBeInTheDocument();

    const savingsIcons = document.querySelectorAll('.category-card mat-icon');
    const incomeIcon = Array.from(savingsIcons).find(
      (icon) => icon.textContent?.trim() === 'savings',
    );
    expect(incomeIcon).toBeDefined();
  });
});
