import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { HomePageScreen } from './home-screen';
import { CategoryService, Category } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

describe('HomePageScreen', () => {
  let fixture: ComponentFixture<HomePageScreen>;

  const mockCategories: Category[] = [
    {
      id: 'food', name: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant',
      sortOrder: 10, isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'income', name: 'Zarobek', colorHex: '#10B981', icon: 'savings',
      sortOrder: 5, isHidden: false, transactionType: 'income',
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const mockCategoryService = {
    getVisibleCategories: () => of(mockCategories),
    getVisibleCategoriesAsync: () => Promise.resolve(mockCategories),
    getCategories: () => of(mockCategories),
    getCategoriesAsync: () => Promise.resolve(mockCategories),
  };

  function createTransactionState(overrides?: Partial<{
    loading: boolean;
    initialized: boolean;
    error: string | null;
  }>) {
    const { loading = false, initialized = true, error = null } = overrides ?? {};
    return {
      transactions: () => [],
      loading: () => loading,
      initialized: () => initialized,
      error: () => error,
      mutationError: () => null,
      addTransaction: () => Promise.resolve(),
      deleteTransaction: () => Promise.resolve(),
      editTransaction: () => Promise.resolve(),
      balance: () => 0,
      transactionsResource: {
        value: () => [],
        status: () => 'Resolved' as const,
        isLoading: () => loading,
        error: () => error,
      },
    };
  }

  describe('loading state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomePageScreen],
        providers: [
          { provide: CategoryService, useValue: mockCategoryService },
          { provide: TransactionState, useValue: createTransactionState({ loading: true, initialized: false }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomePageScreen);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render skeleton during initial loading', () => {
      const skeleton = fixture.debugElement.query(By.css('transaction-home-screen-skeleton'));
      expect(skeleton).toBeTruthy();
    });

    it('should not render content during initial loading', () => {
      const categories = fixture.debugElement.query(By.css('transaction-categories-quick-add'));
      const lastTx = fixture.debugElement.query(By.css('transaction-last-transaction'));
      expect(categories).toBeFalsy();
      expect(lastTx).toBeFalsy();
    });
  });

  describe('loaded state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomePageScreen],
        providers: [
          { provide: CategoryService, useValue: mockCategoryService },
          { provide: TransactionState, useValue: createTransactionState({ loading: false, initialized: true }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomePageScreen);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render categories quick-add in loaded state', () => {
      const categories = fixture.debugElement.query(By.css('transaction-categories-quick-add'));
      expect(categories).toBeTruthy();
    });

    it('should render last-transaction component in loaded state', () => {
      const lastTx = fixture.debugElement.query(By.css('transaction-last-transaction'));
      expect(lastTx).toBeTruthy();
    });

    it('should render income FAB in loaded state', () => {
      const fab = fixture.debugElement.query(By.css('transaction-home-screen-income-fab'));
      expect(fab).toBeTruthy();
    });
  });

  describe('error / offline state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomePageScreen],
        providers: [
          { provide: CategoryService, useValue: mockCategoryService },
          { provide: TransactionState, useValue: createTransactionState({ error: 'Load failed' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomePageScreen);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render offline indicator when error is present', () => {
      const indicatorText = fixture.debugElement.query(By.css('transaction-home-screen-offline-indicator .info'));
      expect(indicatorText).toBeTruthy();
      expect(indicatorText.nativeElement.textContent).toContain('Tryb offline');
    });
  });

  describe('no error state', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomePageScreen],
        providers: [
          { provide: CategoryService, useValue: mockCategoryService },
          { provide: TransactionState, useValue: createTransactionState({}) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(HomePageScreen);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should not render offline indicator when error is null', () => {
      const indicatorText = fixture.debugElement.query(By.css('transaction-home-screen-offline-indicator .info'));
      expect(indicatorText).toBeFalsy();
    });
  });
});