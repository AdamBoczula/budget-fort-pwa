import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService, Category } from '@data-access-transaction';
import { HomeScreenIncomeFabComponent } from './home-screen-income-fab';
import { TransactionState } from '../../service/transaction-state/transaction-state';

describe('HomeScreenIncomeFabComponent', () => {
  let fixture: ComponentFixture<HomeScreenIncomeFabComponent>;
  let component: HomeScreenIncomeFabComponent;

  const incomeCategory: Category = {
    id: 'income',
    name: 'Zarobek',
    colorHex: '#10B981',
    icon: 'savings',
    sortOrder: 5,
    isHidden: false,
    transactionType: 'income',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const mockDialog = {
    open: vi.fn(),
  };

  const mockCategoryService = {
    getCategoriesAsync: vi.fn(),
    getVisibleCategories: () => of([incomeCategory]),
    getVisibleCategoriesAsync: () => Promise.resolve([incomeCategory]),
    getCategories: () => of([incomeCategory]),
  };

  const mockTransactionState = {
    addTransaction: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(null),
    });
    mockCategoryService.getCategoriesAsync.mockResolvedValue([incomeCategory]);

    await TestBed.configureTestingModule({
      imports: [HomeScreenIncomeFabComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionState, useValue: mockTransactionState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeScreenIncomeFabComponent);
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

  it('should open dialog on click when income category exists', async () => {
    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    await fixture.whenStable();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { category: incomeCategory },
      }),
    );
  });

  it('should not open dialog when no income category exists', async () => {
    mockCategoryService.getCategoriesAsync.mockResolvedValue([]);

    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    await fixture.whenStable();

    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should add transaction after dialog confirms', async () => {
    const result = {
      amount: 1000,
      date: '2026-08-15T00:00:00.000Z',
      categoryId: 'income',
      accountId: 'default',
      comment: 'Wypłata',
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(result),
    });

    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    await fixture.whenStable();

    expect(mockTransactionState.addTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionState.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        categoryId: 'income',
        comment: 'Wypłata',
      }),
    );
  });

  it('should not add transaction when dialog is cancelled', async () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(null),
    });

    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    await fixture.whenStable();

    expect(mockTransactionState.addTransaction).not.toHaveBeenCalled();
  });
});