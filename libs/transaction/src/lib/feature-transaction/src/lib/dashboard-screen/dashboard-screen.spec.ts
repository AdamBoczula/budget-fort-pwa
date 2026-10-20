// spec: docs/specs/budget/planowanie-budzetu.md
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { of } from 'rxjs';
import { DashboardPageScreen } from './dashboard-screen';
import { CategoryService, Category } from '@data-access-transaction';
import { DashboardState } from '../service/dashboard-state/dashboard-state';
import { TransactionState } from '../service/transaction-state/transaction-state';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { BudgetState } from '@feature-budget';

describe('DashboardPageScreen', () => {
  beforeAll(() => {
    registerLocaleData(localePl);
  });

  const mockCategories: Category[] = [
    {
      id: 'food', name: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant',
      sortOrder: 10, isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const mockCategoryService = {
    getVisibleCategories: () => of(mockCategories),
    getVisibleCategoriesAsync: () => Promise.resolve(mockCategories),
    getCategories: () => of(mockCategories),
    getCategoriesAsync: () => Promise.resolve(mockCategories),
  };

  const mockDashboardState = {
    periodMode: () => 'month' as const,
    selectedYear: () => 2026,
    selectedMonth: () => 6,
    availableYears: () => [2026],
    periodLabel: () => 'lipiec 2026',
    canGoNext: () => false,
    canGoPrevious: () => true,
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    setPeriodMode: vi.fn(),
    setMonth: vi.fn(),
    setYear: vi.fn(),
    categorySpending: () => [],
    totalSpending: () => 0,
    expenseTransactions: () => [],
    expenseCategories: () => mockCategories,
    categoryWithSubcategories: () => [],
    transactionCount: () => 0,
    filteredTransactions: () => [],
    allTransactions: () => [],
    categories: () => mockCategories,
  };

  const mockTransactionState = {
    transactions: () => [],
    loading: () => false,
    initialized: () => true,
    error: () => null,
    mutationError: () => null,
    addTransaction: () => Promise.resolve(),
    deleteTransaction: () => Promise.resolve(),
    editTransaction: () => Promise.resolve(),
    balance: () => 0,
    transactionsResource: {
      value: () => [],
      status: () => 'Resolved' as const,
      isLoading: () => false,
      error: () => null,
    },
  };

  const mockDialog = {
    open: () => ({
      afterClosed: () => of(null),
    }),
  };

  function createBudgetStateMock(overrides?: {
    overallProgress?: { spent: number; limit: number; percentage: number };
    categoryProgresses?: Array<{ categoryId: string; categoryName: string; spent: number; limit: number; percentage: number }>;
    loading?: boolean;
    error?: string | null;
  }) {
    return {
      overallProgress: () => overrides?.overallProgress ?? { spent: 0, limit: 0, percentage: 0 },
      categoryProgresses: () => overrides?.categoryProgresses ?? [],
      loading: () => overrides?.loading ?? false,
      error: () => overrides?.error ?? null,
      reload: vi.fn(),
    };
  }

  async function createFixture(budgetStateOverrides?: Parameters<typeof createBudgetStateMock>[0]) {
    const budgetState = createBudgetStateMock(budgetStateOverrides);

    await TestBed.configureTestingModule({
      imports: [DashboardPageScreen],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: DashboardState, useValue: mockDashboardState },
        { provide: TransactionState, useValue: mockTransactionState },
        { provide: MatDialog, useValue: mockDialog },
        { provide: BudgetState, useValue: budgetState },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPageScreen);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, budgetState };
  }

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-1
  it('should show empty budget message when no budget is set (limit = 0)', async () => {
    const { fixture } = await createFixture();
    const emptyMsg = fixture.debugElement.query(By.css('.dashboard__empty-message'));
    expect(emptyMsg).toBeTruthy();
    expect(emptyMsg.nativeElement.textContent).toContain('Nie ustawiono budżetu miesięcznego');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  it('should show overall budget progress bar when limit > 0', async () => {
    const { fixture } = await createFixture({
      overallProgress: { spent: 2000, limit: 5000, percentage: 40 },
    });

    const progressBar = fixture.debugElement.query(By.css('budget-progress-bar'));
    expect(progressBar).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.dashboard__empty-message'))).toBeFalsy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-2
  it('should show category budget progress bars when category limits exist', async () => {
    const { fixture } = await createFixture({
      overallProgress: { spent: 2000, limit: 5000, percentage: 40 },
      categoryProgresses: [
        { categoryId: '1', categoryName: 'Jedzenie', spent: 800, limit: 1500, percentage: 53 },
        { categoryId: '2', categoryName: 'Transport', spent: 300, limit: 500, percentage: 60 },
      ],
    });

    const progressBars = fixture.debugElement.queryAll(By.css('budget-progress-bar'));
    expect(progressBars.length).toBe(3); // 1 overall + 2 category
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-7
  it('should not show category section when no category limits exist', async () => {
    const { fixture } = await createFixture({
      overallProgress: { spent: 2000, limit: 5000, percentage: 40 },
      categoryProgresses: [],
    });

    const progressBars = fixture.debugElement.queryAll(By.css('budget-progress-bar'));
    expect(progressBars.length).toBe(1); // only overall
  });

  // covers: docs/specs/budget/planowanie-budzetu.md loading state
  it('should show skeleton while loading', async () => {
    const { fixture } = await createFixture({ loading: true });

    const skeleton = fixture.debugElement.query(By.css('.dashboard__budget-skeleton'));
    expect(skeleton).toBeTruthy();
  });

  // covers: docs/specs/budget/planowanie-budzetu.md error state
  it('should show error with retry button when loading fails', async () => {
    const { fixture } = await createFixture({ error: 'Failed to load budget.' });

    const errorSection = fixture.debugElement.query(By.css('.dashboard__budget-error'));
    expect(errorSection).toBeTruthy();
  });

  it('should render period selector', async () => {
    const { fixture } = await createFixture();
    const selector = fixture.debugElement.query(By.css('transaction-dashboard-period-selector'));
    expect(selector).toBeTruthy();
  });

  it('should render pie chart', async () => {
    const { fixture } = await createFixture();
    const chart = fixture.debugElement.query(By.css('transaction-dashboard-pie-chart'));
    expect(chart).toBeTruthy();
  });

  it('should render category list', async () => {
    const { fixture } = await createFixture();
    const list = fixture.debugElement.query(By.css('transaction-dashboard-category-list'));
    expect(list).toBeTruthy();
  });
});