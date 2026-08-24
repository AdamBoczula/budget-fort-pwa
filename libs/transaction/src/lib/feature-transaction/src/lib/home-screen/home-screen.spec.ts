import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { HomePageScreen } from './home-screen';
import { CategoryService, Category } from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

describe('HomePageScreen', () => {
  let component: HomePageScreen;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageScreen],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionState, useValue: mockTransactionState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageScreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render FAB button with mat-fab', () => {
    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    expect(fabButton).toBeTruthy();
    expect(fabButton.attributes['mat-fab']).toBeDefined();
  });

  it('should render FAB with add icon', () => {
    const fabIcon = fixture.debugElement.query(By.css('.fab-income mat-icon'));
    expect(fabIcon).toBeTruthy();
    expect(fabIcon.nativeElement.textContent).toContain('add');
  });
});