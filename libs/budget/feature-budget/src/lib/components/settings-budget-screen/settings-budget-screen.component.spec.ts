// spec: docs/specs/budget/przeglad-historii-budzetu.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CategoryService, Category, TransactionService } from '@data-access-transaction';
import { BudgetService, CategoryBudgetService } from '@data-access-budget';
import { SettingsBudgetScreenComponent } from './settings-budget-screen.component';
import { BudgetAggregationService } from '../../services/budget-aggregation.service';
import { BudgetState } from '../../services/budget-state';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CategoryEditDialogComponent } from '../category-edit-dialog/category-edit-dialog.component';

const MOCK_EXPENSE_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Jedzenie',
    colorHex: '#16A34A',
    icon: 'restaurant',
    sortOrder: 10,
    isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Transport',
    colorHex: '#2563EB',
    icon: 'directions_car',
    sortOrder: 20,
    isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const MOCK_CATEGORY_BUDGETS = [
  {
    id: 1,
    categoryId: '1',
    categoryName: 'Jedzenie',
    amount: 1500,
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 2,
    categoryId: '2',
    categoryName: 'Transport',
    amount: 500,
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

describe('SettingsBudgetScreenComponent', () => {
  let fixture: ComponentFixture<SettingsBudgetScreenComponent>;

  const mockCategoryService = {
    getVisibleCategoriesAsync: vi.fn().mockResolvedValue(MOCK_EXPENSE_CATEGORIES),
    getCategoriesAsync: vi.fn().mockResolvedValue(MOCK_EXPENSE_CATEGORIES),
  };

  const mockBudgetService = {
    getBudget: vi
      .fn()
      .mockResolvedValue({ id: 1, amount: 5000, updatedAt: '2026-10-01T00:00:00.000Z' }),
    saveBudget: vi.fn().mockResolvedValue(undefined),
  };

  const mockCategoryBudgetService = {
    getAll: vi.fn().mockResolvedValue(MOCK_CATEGORY_BUDGETS),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByCategoryId: vi.fn().mockResolvedValue(undefined),
  };

  const mockTransactionService = {
    getTransactionsAsync: vi.fn().mockResolvedValue([]),
  };

  const mockBudgetState = {
    reload: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockDialog = {
    open: vi.fn().mockReturnValue({
      afterClosed: () => ({ subscribe: vi.fn() }),
    }),
  };

  async function setup(categoryBudgets = MOCK_CATEGORY_BUDGETS): Promise<void> {
    vi.clearAllMocks();
    mockBudgetService.getBudget.mockResolvedValue({
      id: 1,
      amount: 5000,
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
    mockCategoryBudgetService.getAll.mockResolvedValue(categoryBudgets);
    mockCategoryService.getVisibleCategoriesAsync.mockResolvedValue(MOCK_EXPENSE_CATEGORIES);
    mockTransactionService.getTransactionsAsync.mockResolvedValue([]);

    // Reset the dialog mock with a working return value that resolves immediately
    mockDialog.open.mockReturnValue({
      afterClosed: () => ({
        subscribe: (fn: (value: unknown) => void) => {
          fn(undefined);
          return { unsubscribe: vi.fn() };
        },
      }),
    });

    await TestBed.configureTestingModule({
      imports: [SettingsBudgetScreenComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        provideNoopAnimations(),
        BudgetAggregationService,
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: CategoryBudgetService, useValue: mockCategoryBudgetService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: BudgetState, useValue: mockBudgetState },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsBudgetScreenComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-1
  it('should display current month overview card with total limits', async () => {
    await setup();

    const title = fixture.debugElement.query(By.css('.settings-budget__title'));
    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('Budżet');

    // Overall budget should be sum of category limits: 1500 + 500 = 2000
    const agg = TestBed.inject(BudgetAggregationService);
    expect(agg.overallBudget()).toBe(2000);

    // Selected period spent should be 0 (no transactions provided)
    expect(fixture.componentInstance.selectedPeriodSpent()).toBe(0);
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md — UI-04: filter income categories
  it('should filter out income categories from budget limits', async () => {
    const mixedCategories: Category[] = [
      {
        id: '1',
        name: 'Jedzenie',
        colorHex: '#16A34A',
        icon: 'restaurant',
        sortOrder: 10,
        isHidden: false,
        transactionType: 'expense',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'Transport',
        colorHex: '#2563EB',
        icon: 'directions_car',
        sortOrder: 20,
        isHidden: false,
        transactionType: 'expense',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '3',
        name: 'Wynagrodzenie',
        colorHex: '#DC2626',
        icon: 'payments',
        sortOrder: 5,
        isHidden: false,
        transactionType: 'income',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    mockCategoryService.getVisibleCategoriesAsync.mockResolvedValue(mixedCategories);

    await setup();

    // Only expense categories should appear
    const categoryCards = fixture.debugElement.queryAll(By.css('budget-category-card'));
    expect(categoryCards.length).toBe(2);

    const labelTexts = fixture.debugElement.nativeElement.textContent ?? '';
    expect(labelTexts).toContain('Jedzenie');
    expect(labelTexts).toContain('Transport');
    expect(labelTexts).not.toContain('Wynagrodzenie');
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md — UI-04: backward compat (missing transactionType = expense)
  it('should treat categories without transactionType as expense', async () => {
    // MOCK_EXPENSE_CATEGORIES already lack transactionType
    await setup();

    // All categories should appear (treated as expense)
    const categoryCards = fixture.debugElement.queryAll(By.css('budget-category-card'));
    expect(categoryCards.length).toBe(2);

    const labelTexts = fixture.debugElement.nativeElement.textContent ?? '';
    expect(labelTexts).toContain('Jedzenie');
    expect(labelTexts).toContain('Transport');
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-2
  it('should display list of expense categories with limit fields', async () => {
    await setup();

    const sectionTitle = fixture.debugElement.query(By.css('.settings-budget__section-title'));
    expect(sectionTitle).toBeTruthy();
    expect(sectionTitle.nativeElement.textContent).toContain('Limity kategorii');

    // Category cards are now child components rendered inside mat-card
    const categoryCards = fixture.debugElement.queryAll(By.css('budget-category-card'));
    expect(categoryCards.length).toBe(2);

    // Check that the labels contain correct names (text rendered inside child)
    const labelTexts = fixture.debugElement.nativeElement.textContent ?? '';
    expect(labelTexts).toContain('Jedzenie');
    expect(labelTexts).toContain('Transport');

    // Input fields are inside child components
    const inputs = fixture.debugElement.queryAll(
      By.css('budget-category-card input[type="number"]'),
    );
    expect(inputs.length).toBe(2);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should save category limits when clicking Zapisz', async () => {
    await setup();

    await fixture.componentInstance.onSave();
    await fixture.whenStable();
    await fixture.whenStable();

    expect(mockBudgetService.saveBudget).toHaveBeenCalledWith(2000);
    expect(mockCategoryBudgetService.save).toHaveBeenCalledWith('1', 'Jedzenie', 1500);
    expect(mockCategoryBudgetService.save).toHaveBeenCalledWith('2', 'Transport', 500);
    expect(mockBudgetState.reload).toHaveBeenCalled();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-10
  it('should delete category limit when field cleared and saved', async () => {
    await setup();

    fixture.componentInstance.getCategoryControl('2').setValue(0);
    fixture.detectChanges();

    await fixture.componentInstance.onSave();
    await fixture.whenStable();
    await fixture.whenStable();

    expect(mockCategoryBudgetService.deleteByCategoryId).toHaveBeenCalledWith('2');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#UC-4
  it('should update category limit and save', async () => {
    await setup();

    fixture.componentInstance.getCategoryControl('2').setValue(800);
    fixture.detectChanges();

    await fixture.componentInstance.onSave();
    await fixture.whenStable();
    await fixture.whenStable();

    expect(mockCategoryBudgetService.save).toHaveBeenCalledWith('2', 'Transport', 800);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md — quick actions
  it('should display quick action links when on current month', async () => {
    await setup();

    const quickActions = fixture.debugElement.queryAll(By.css('budget-quick-actions'));
    expect(quickActions.length).toBe(1);

    const actionTexts = fixture.debugElement.nativeElement.textContent ?? '';
    expect(actionTexts).toContain('Dodaj transakcję');
    expect(actionTexts).toContain('Dashboard');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md — copy limits
  it('should copy limits from previous month', async () => {
    // Provide transactions in the previous month to trigger previousMonthSummary
    const now = new Date();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevMonthDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-15T12:00:00.000Z`;

    mockTransactionService.getTransactionsAsync.mockResolvedValue([
      { id: 'tx1', amount: -300, categoryId: '1', date: prevMonthDate } as any,
      { id: 'tx2', amount: -450, categoryId: '2', date: prevMonthDate } as any,
    ]);

    await setup();

    // First clear all limits
    fixture.componentInstance.getCategoryControl('1').setValue(0);
    fixture.componentInstance.getCategoryControl('2').setValue(0);
    fixture.detectChanges();

    const agg = TestBed.inject(BudgetAggregationService);
    expect(agg.overallBudget()).toBe(0);

    // Copy from previous month (limits come from categoryBudgets = 1500 and 500)
    fixture.componentInstance.copyLimitsFromPreviousMonth();
    fixture.detectChanges();

    expect(fixture.componentInstance.getCategoryControl('1').value).toBe(1500);
    expect(fixture.componentInstance.getCategoryControl('2').value).toBe(500);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md — validation
  it('should show validation error for negative limit', async () => {
    await setup();

    const control = fixture.componentInstance.getCategoryControl('1');
    control.setValue(-100);
    control.markAsTouched();
    fixture.detectChanges();

    expect(control.hasError('min')).toBe(true);
    expect(control.invalid).toBe(true);
    expect(fixture.componentInstance.categoryForm.invalid).toBe(true);
  });

  // covers: docs/specs/budget/planowanie-budzetu.md — validation
  it('should not save when form is invalid', async () => {
    await setup();

    // Reset mocks to ignore calls from loadData()
    mockBudgetService.saveBudget.mockClear();
    mockCategoryBudgetService.save.mockClear();

    const control = fixture.componentInstance.getCategoryControl('1');
    control.setValue(-50);
    fixture.detectChanges();

    await fixture.componentInstance.onSave();
    await fixture.whenStable();

    // Form was invalid, so saveBudget should not have been called by onSave
    expect(mockBudgetService.saveBudget).not.toHaveBeenCalled();
    expect(mockCategoryBudgetService.save).not.toHaveBeenCalled();
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md — UI-03: category edit dialog
  it('should open edit dialog when calling editCategory', async () => {
    await setup();

    // Call editCategory directly on component instance
    await fixture.componentInstance.editCategory(MOCK_EXPENSE_CATEGORIES[0]);

    // Verify dialog was opened with correct data
    expect(mockDialog.open).toHaveBeenCalledWith(
      CategoryEditDialogComponent,
      expect.objectContaining({
        data: { category: MOCK_EXPENSE_CATEGORIES[0] },
      }),
    );
  });

  // covers: docs/qa/2026-10-21-ui-ux-audit.md — UI-03: category edit button
  it('should render edit button on each category card and not make the whole card a button', async () => {
    await setup();

    const clickableCards = fixture.debugElement.queryAll(
      By.css('.settings-budget__card--clickable'),
    );
    expect(clickableCards.length).toBe(0);

    const editButtons = fixture.debugElement.queryAll(
      By.css('budget-category-card .category-card__edit-btn'),
    );
    expect(editButtons.length).toBe(2);

    editButtons[0].nativeElement.click();
    fixture.detectChanges();

    expect(mockDialog.open).toHaveBeenCalledWith(
      CategoryEditDialogComponent,
      expect.objectContaining({
        data: { category: MOCK_EXPENSE_CATEGORIES[0] },
      }),
    );
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should not open category edit dialog when clicking the limit input', async () => {
    await setup();

    const limitInput = fixture.debugElement.query(
      By.css('budget-category-card input[type="number"]'),
    );
    expect(limitInput).toBeTruthy();

    limitInput.nativeElement.click();
    fixture.detectChanges();

    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should not update previous month limit when typing a new limit in the form', async () => {
    await setup([]);

    const agg = TestBed.inject(BudgetAggregationService);
    expect(agg.categorySpendingMap().get('1')?.limit).toBe(0);

    fixture.componentInstance.getCategoryControl('1').setValue(1200);
    fixture.detectChanges();

    expect(agg.overallBudget()).toBe(1200);
    expect(agg.categorySpendingMap().get('1')?.limit).toBe(0);
    expect(agg.previousMonthSummary()?.budgetLimit).toBe(0);
  });
});
