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

describe('DashboardPageScreen', () => {
  let fixture: ComponentFixture<DashboardPageScreen>;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageScreen],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: DashboardState, useValue: mockDashboardState },
        { provide: TransactionState, useValue: mockTransactionState },
        { provide: MatDialog, useValue: mockDialog },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageScreen);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render period selector', () => {
    const selector = fixture.debugElement.query(By.css('transaction-dashboard-period-selector'));
    expect(selector).toBeTruthy();
  });

  it('should render pie chart', () => {
    const chart = fixture.debugElement.query(By.css('transaction-dashboard-pie-chart'));
    expect(chart).toBeTruthy();
  });

  it('should render category list', () => {
    const list = fixture.debugElement.query(By.css('transaction-dashboard-category-list'));
    expect(list).toBeTruthy();
  });
});
