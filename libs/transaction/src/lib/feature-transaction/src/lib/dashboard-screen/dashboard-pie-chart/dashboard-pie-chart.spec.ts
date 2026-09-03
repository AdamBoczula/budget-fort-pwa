import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { DashboardPieChartComponent } from './dashboard-pie-chart';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';

describe('DashboardPieChartComponent', () => {
  let fixture: ComponentFixture<DashboardPieChartComponent>;

  beforeAll(() => {
    registerLocaleData(localePl);
  });

  const baseMockState = {
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
    totalSpending: () => 0,
    expenseTransactions: () => [],
    expenseCategories: () => [],
    categoryWithSubcategories: () => [],
    transactionCount: () => 0,
    filteredTransactions: () => [],
    allTransactions: () => [],
    categories: () => [],
  };

  describe('empty state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DashboardPieChartComponent],
        providers: [
          {
            provide: DashboardState,
            useValue: {
              ...baseMockState,
              categorySpending: () => [],
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardPieChartComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should show empty message when no data', () => {
      const emptyMsg = fixture.debugElement.query(By.css('.pie-chart-empty'));
      expect(emptyMsg).toBeTruthy();
    });

    it('should not render canvas when no data', () => {
      const canvas = fixture.debugElement.query(By.css('canvas'));
      expect(canvas).toBeFalsy();
    });
  });

  describe('with data', () => {
    const mockCategorySpending = [
      { categoryId: 'food', categoryName: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant', totalAmount: 500, percentage: 50, transactions: [] },
      { categoryId: 'transport', categoryName: 'Transport', colorHex: '#2563EB', icon: 'directions_car', totalAmount: 300, percentage: 30, transactions: [] },
    ];

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DashboardPieChartComponent],
        providers: [
          {
            provide: DashboardState,
            useValue: {
              ...baseMockState,
              categorySpending: () => mockCategorySpending,
              totalSpending: () => 800,
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardPieChartComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render canvas element', () => {
      const canvas = fixture.debugElement.query(By.css('canvas'));
      expect(canvas).toBeTruthy();
    });

    it('should hide empty message when data exists', () => {
      const emptyMsg = fixture.debugElement.query(By.css('.pie-chart-empty'));
      expect(emptyMsg).toBeFalsy();
    });
  });
});