import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { DashboardCategoryListComponent } from './dashboard-category-list';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';
import { Transaction } from '@data-access-transaction';

describe('DashboardCategoryListComponent', () => {
  let fixture: ComponentFixture<DashboardCategoryListComponent>;

  beforeAll(() => {
    registerLocaleData(localePl);
  });

  const mockTransactions: Transaction[] = [
    { id: '1', amount: -150, date: '2026-07-15T12:00:00.000Z', categoryId: 'food', accountId: 'default', comment: 'Obiad', subcategory: 'Jedzenie na mieście' },
    { id: '2', amount: -80, date: '2026-07-20T12:00:00.000Z', categoryId: 'food', accountId: 'default', subcategory: 'Zakupy' },
  ];

  const mockCategoryWithSubcategories = [
    {
      categoryId: 'food',
      categoryName: 'Jedzenie',
      colorHex: '#16A34A',
      icon: 'restaurant',
      totalAmount: 230,
      percentage: 43.4,
      transactions: mockTransactions.filter((t) => t.categoryId === 'food'),
      subcategories: [
        { name: 'Jedzenie na mieście', totalAmount: 150, transactions: [mockTransactions[0]] },
        { name: 'Zakupy', totalAmount: 80, transactions: [mockTransactions[1]] },
      ],
    },
  ];

  function createMockState(data: { hasData: boolean }) {
    return {
      categoryWithSubcategories: () => data.hasData ? mockCategoryWithSubcategories : [],
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
      totalSpending: () => 230,
      expenseTransactions: () => mockTransactions,
      expenseCategories: () => [],
      transactionCount: () => 2,
      filteredTransactions: () => mockTransactions,
      allTransactions: () => mockTransactions,
      categories: () => [],
    };
  }

  describe('with data', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DashboardCategoryListComponent],
        providers: [{ provide: DashboardState, useValue: createMockState({ hasData: true }) }],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardCategoryListComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render expansion panels for each category', () => {
      const panels = fixture.debugElement.queryAll(By.css('mat-expansion-panel'));
      expect(panels.length).toBe(1);
    });

    it('should display category name', () => {
      const title = fixture.debugElement.query(By.css('.panel-title__name'));
      expect(title.nativeElement.textContent).toContain('Jedzenie');
    });

    it('should display total amount with currency', () => {
      const amount = fixture.debugElement.query(By.css('.panel-description__amount'));
      expect(amount.nativeElement.textContent).toContain('zł');
    });

    it('should show percentage', () => {
      const pct = fixture.debugElement.query(By.css('.panel-description__percentage'));
      expect(pct.nativeElement.textContent).toContain('43.4%');
    });

    it('should render subcategory sections', () => {
      const subs = fixture.debugElement.queryAll(By.css('.subcategory'));
      expect(subs.length).toBe(2);
    });

    it('should not show empty message', () => {
      expect(fixture.debugElement.query(By.css('.category-list__empty'))).toBeFalsy();
    });
  });

  describe('empty state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DashboardCategoryListComponent],
        providers: [{ provide: DashboardState, useValue: createMockState({ hasData: false }) }],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardCategoryListComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should show empty message', () => {
      const empty = fixture.debugElement.query(By.css('.category-list__empty'));
      expect(empty).toBeTruthy();
      expect(empty.nativeElement.textContent).toContain('Brak wydatków');
    });

    it('should not render panels when empty', () => {
      expect(fixture.debugElement.queryAll(By.css('mat-expansion-panel')).length).toBe(0);
    });
  });
});
