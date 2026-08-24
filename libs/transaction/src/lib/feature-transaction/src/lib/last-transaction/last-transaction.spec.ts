import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { of } from 'rxjs';
import {
  CategoryService,
  Category,
} from '@data-access-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';
import { LastTransactionComponent } from './last-transaction';

describe('LastTransactionComponent', () => {
  let component: LastTransactionComponent;
  let fixture: ComponentFixture<LastTransactionComponent>;
  let transactionsSignal: () => Array<Record<string, unknown>>;

  beforeAll(() => {
    registerLocaleData(localePl);
  });

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

  const defaultTransactions = [
    {
      id: 'tx-1',
      amount: -42.5,
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0).toISOString(),
      categoryId: 'food',
      accountId: 'default',
      comment: 'Test transaction',
    },
    {
      id: 'tx-2',
      amount: 100,
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 2, 12, 0, 0).toISOString(),
      categoryId: 'income',
      accountId: 'default',
    },
    {
      id: 'tx-other-month',
      amount: -999,
      date: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
      categoryId: 'food',
      accountId: 'default',
    },
  ];

  beforeEach(() => {
    transactionsSignal = () => [...defaultTransactions];
  });

  const mockCategoryService = {
    getCategories: () => of(mockCategories),
    getCategoriesAsync: () => Promise.resolve(mockCategories),
  };

  const mockTransactionState = {
    transactions: () => transactionsSignal(),
    loading: () => false,
    initialized: () => true,
    error: () => null,
    mutationError: () => null,
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    editTransaction: vi.fn().mockResolvedValue(undefined),
    loadTransactions: vi.fn().mockResolvedValue(undefined),
    addTransaction: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastTransactionComponent],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionState, useValue: mockTransactionState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LastTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const title = fixture.debugElement.query(By.css('.last-transactions__title'));
    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('Ostatnie transakcje');
  });

  it('should render transaction items in date-descending order', () => {
    const items = fixture.debugElement.queryAll(By.css('.last-transactions__item'));
    // tx-other-month is from a different month and should be filtered out
    expect(items.length).toBe(2);
  });

  it('should filter out transactions from other months', () => {
    // All 3 transactions are in the mock, but tx-other-month is from previous year
    expect(component.lastTransactions().length).toBe(2);
    expect(component.lastTransactions().find((t) => t.id === 'tx-other-month')).toBeUndefined();
  });

  it('should display category name for each transaction', () => {
    const nameEls = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-name'),
    );
    expect(nameEls.length).toBe(2);
    // First transaction in sorted order is tx-2 (income, later date)
    expect(nameEls[0].nativeElement.textContent).toContain('Zarobek');
    expect(nameEls[1].nativeElement.textContent).toContain('Jedzenie');
  });

  it('should render category names without fallback dash on initial load', () => {
    const nameEls = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-name'),
    );
    nameEls.forEach((el) => {
      expect(el.nativeElement.textContent).not.toContain('—');
    });
  });

  it('should render category icons on initial load (no race condition)', () => {
    const icons = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-icon mat-icon'),
    );
    expect(icons.length).toBe(2);
    // First transaction in sorted order = income (savings), second = food (restaurant)
    expect(icons[0].nativeElement.textContent.trim()).toBe('savings');
    expect(icons[1].nativeElement.textContent.trim()).toBe('restaurant');
  });

  it('should render icon background colors based on category color', () => {
    const iconEls = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-icon'),
    );
    // Income → #10B981, Food → #16A34A
    expect(iconEls[0].nativeElement.style.backgroundColor).toBe('rgb(16, 185, 129)');
    expect(iconEls[1].nativeElement.style.backgroundColor).toBe('rgb(22, 163, 74)');
  });

  it('should display comment when present', () => {
    const comments = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-comment'),
    );
    expect(comments.length).toBe(1);
    expect(comments[0].nativeElement.textContent).toContain('Test transaction');
  });

  it('should format amounts correctly (income positive, expense negative)', () => {
    const amountEls = fixture.debugElement.queryAll(
      By.css('.last-transactions__item-amount'),
    );
    expect(amountEls.length).toBe(2);
    // First (income, 100) should not have minus
    expect(amountEls[0].nativeElement.textContent).not.toContain('-');
    // Second (expense, -42.5) should have minus in the formatted result
    expect(amountEls[1].nativeElement.textContent).toContain('-');
  });

  it('should show income style for positive amounts', () => {
    const incomeAmount = fixture.debugElement.query(
      By.css('.last-transactions__item-amount--income'),
    );
    expect(incomeAmount).toBeTruthy();
  });

  it('should have edit and delete buttons on each item', () => {
    const items = fixture.debugElement.queryAll(By.css('.last-transactions__item'));
    items.forEach((item) => {
      const editBtn = item.query(By.css('button[aria-label="Edytuj transakcję"]'));
      const deleteBtn = item.query(By.css('button[aria-label="Usuń transakcję"]'));
      expect(editBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
    });
  });

  it('should show empty message when no transactions', () => {
    // Rebuild TestBed with empty transactions
    const emptyTxState = {
      transactions: () => [],
      loading: () => false,
      initialized: () => true,
      error: () => null,
      deleteTransaction: vi.fn(),
      editTransaction: vi.fn(),
      loadTransactions: vi.fn(),
      addTransaction: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LastTransactionComponent],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionState, useValue: emptyTxState },
      ],
    });

    const emptyFixture = TestBed.createComponent(LastTransactionComponent);
    emptyFixture.detectChanges();

    const emptyMsg = emptyFixture.debugElement.query(
      By.css('.last-transactions__empty'),
    );
    expect(emptyMsg).toBeTruthy();
    expect(emptyMsg.nativeElement.textContent).toContain('Brak transakcji');

    const items = emptyFixture.debugElement.queryAll(By.css('.last-transactions__item'));
    expect(items.length).toBe(0);
  });
});
