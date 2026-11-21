import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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

  const expenseCategory: Category = {
    id: 'food',
    name: 'Jedzenie',
    colorHex: '#16A34A',
    icon: 'restaurant',
    sortOrder: 10,
    isHidden: false,
    transactionType: 'expense',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockCategoryService: {
    getCategoriesAsync: ReturnType<typeof vi.fn>;
    getVisibleCategories: () => ReturnType<typeof of>;
    getVisibleCategoriesAsync: ReturnType<typeof vi.fn>;
    getCategories: () => ReturnType<typeof of>;
  };
  let mockTransactionState: { addTransaction: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };
    mockSnackBar = { open: vi.fn() };
    mockCategoryService = {
      getCategoriesAsync: vi.fn().mockResolvedValue([incomeCategory, expenseCategory]),
      getVisibleCategories: () => of([incomeCategory]),
      getVisibleCategoriesAsync: vi.fn().mockResolvedValue([incomeCategory, expenseCategory]),
      getCategories: () => of([incomeCategory]),
    };
    mockTransactionState = { addTransaction: vi.fn().mockResolvedValue(undefined) };

    mockDialog.open.mockReturnValue({
      afterClosed: () => of(null),
    });
    mockCategoryService.getCategoriesAsync.mockResolvedValue([incomeCategory, expenseCategory]);

    await TestBed.configureTestingModule({
      imports: [HomeScreenIncomeFabComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionState, useValue: mockTransactionState },
      ],
    })
      .overrideComponent(HomeScreenIncomeFabComponent, {
        add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] },
      })
      .compileComponents();

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

  it('should toggle speed-dial actions when main FAB is clicked', () => {
    expect(fixture.debugElement.query(By.css('.fab-action--income'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.fab-action--expense'))).toBeNull();

    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.fab-action--income'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.fab-action--expense'))).toBeTruthy();
  });

  it('should open fullscreen income dialog when income speed-dial action is clicked', async () => {
    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    fixture.detectChanges();

    const incomeBtn = fixture.debugElement.query(By.css('.fab-action--income'));
    incomeBtn.nativeElement.click();
    await fixture.whenStable();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { category: incomeCategory },
        panelClass: 'transaction-fullscreen-dialog',
      }),
    );
  });

  it('should open fullscreen expense dialog when expense speed-dial action is clicked', async () => {
    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    fixture.detectChanges();

    const expenseBtn = fixture.debugElement.query(By.css('.fab-action--expense'));
    expenseBtn.nativeElement.click();
    await fixture.whenStable();

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { category: expenseCategory },
        panelClass: 'transaction-fullscreen-dialog',
      }),
    );
  });

  it('should show snackbar and not open dialog when no income category exists', async () => {
    // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-08
    mockCategoryService.getCategoriesAsync.mockResolvedValue([]);

    fixture.debugElement.query(By.css('.fab-income')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.fab-action--income')).nativeElement.click();
    await fixture.whenStable();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Brak kategorii przychodów. Najpierw dodaj kategorię w ustawieniach.',
      undefined,
      { duration: 4000 },
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should show snackbar and not open dialog when no expense category exists', async () => {
    mockCategoryService.getCategoriesAsync.mockResolvedValue([]);

    fixture.debugElement.query(By.css('.fab-income')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.fab-action--expense')).nativeElement.click();
    await fixture.whenStable();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Brak kategorii wydatków. Najpierw dodaj kategorię w ustawieniach.',
      undefined,
      { duration: 4000 },
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should close speed-dial on Escape key', () => {
    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    fixture.detectChanges();
    expect(fabButton.attributes['aria-expanded']).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fabButton.attributes['aria-expanded']).toBe('false');
    expect(fixture.debugElement.query(By.css('.fab-action--income'))).toBeNull();
  });

  it('should add transaction and show snackbar after dialog confirms', async () => {
    // covers: docs/qa/2026-10-21-ui-ux-audit.md#UI-09D
    const result = {
      amount: 1000,
      type: 'income',
      date: '2026-08-15T00:00:00.000Z',
      categoryId: 'income',
      accountId: 'default',
      comment: 'Wypłata',
      subcategory: 'Premia',
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(result),
    });

    fixture.debugElement.query(By.css('.fab-income')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.fab-action--income')).nativeElement.click();
    await fixture.whenStable();

    expect(mockTransactionState.addTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionState.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        categoryId: 'income',
        comment: 'Wypłata',
        subcategory: 'Premia',
      }),
    );
    expect(mockSnackBar.open).toHaveBeenCalledWith('Dodano przychód.', undefined, {
      duration: 3000,
    });
  });

  it('should not add transaction when dialog is cancelled', async () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(null),
    });

    const fabButton = fixture.debugElement.query(By.css('.fab-income'));
    fabButton.nativeElement.click();
    fixture.detectChanges();

    const incomeBtn = fixture.debugElement.query(By.css('.fab-action--income'));
    incomeBtn.nativeElement.click();
    await fixture.whenStable();

    expect(mockTransactionState.addTransaction).not.toHaveBeenCalled();
  });
});
