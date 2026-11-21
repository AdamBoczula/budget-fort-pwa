import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Category, Transaction } from '@data-access-transaction';
import { of } from 'rxjs';
import { TransactionState } from '../transaction-state/transaction-state';
import { TransactionDialogService } from './transaction-dialog.service';

describe('TransactionDialogService', () => {
  let service: TransactionDialogService;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockTransactionState: {
    addTransaction: ReturnType<typeof vi.fn>;
    editTransaction: ReturnType<typeof vi.fn>;
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

  beforeEach(() => {
    mockDialog = { open: vi.fn() };
    mockSnackBar = { open: vi.fn() };
    mockTransactionState = {
      addTransaction: vi.fn().mockResolvedValue(undefined),
      editTransaction: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        TransactionDialogService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: TransactionState, useValue: mockTransactionState },
      ],
    });

    service = TestBed.inject(TransactionDialogService);
  });

  it('should open create dialog and persist added transaction with subcategory', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () =>
        of({
          amount: -42.5,
          type: 'expense',
          date: '2026-08-15T00:00:00.000Z',
          categoryId: 'food',
          accountId: 'default',
          comment: 'Obiad',
          subcategory: 'Lunch',
          isRecurring: false,
        }),
    });

    service.openCreateDialog(expenseCategory);

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    expect(mockTransactionState.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -42.5,
        categoryId: 'food',
        comment: 'Obiad',
        subcategory: 'Lunch',
      }),
    );
    expect(mockSnackBar.open).toHaveBeenCalledWith('Dodano wydatek.', undefined, {
      duration: 3000,
    });
  });

  it('should open edit dialog and persist edited transaction', () => {
    const tx: Transaction = {
      id: 'tx-1',
      amount: -30,
      date: '2026-08-15T00:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
      comment: 'Stary',
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () =>
        of({
          amount: -50,
          type: 'expense',
          date: '2026-08-15T00:00:00.000Z',
          categoryId: 'food',
          accountId: 'default',
          comment: 'Nowy',
          transaction: tx,
        }),
    });

    service.openEditDialog(expenseCategory, tx);

    expect(mockTransactionState.editTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-1',
        amount: -50,
        comment: 'Nowy',
      }),
    );
    expect(mockSnackBar.open).toHaveBeenCalledWith('Zapisano zmiany.', undefined, {
      duration: 3000,
    });
  });

  it('should forward recurring options when editing a transaction', () => {
    const tx: Transaction = {
      id: 'tx-2',
      amount: -40,
      date: '2026-08-15T00:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () =>
        of({
          amount: -40,
          type: 'expense',
          date: '2026-08-15T00:00:00.000Z',
          categoryId: 'food',
          accountId: 'default',
          comment: '',
          transaction: tx,
          isRecurring: true,
          recurringDayOfMonth: 18,
        }),
    });

    service.openEditDialog(expenseCategory, tx);

    expect(mockTransactionState.editTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-2' }),
      { isRecurring: true, dayOfMonth: 18 },
    );
  });

  it('should forward recurring detach option when editing a transaction', () => {
    const tx: Transaction = {
      id: 'tx-3',
      amount: -40,
      date: '2026-08-15T00:00:00.000Z',
      categoryId: 'food',
      accountId: 'default',
      recurringRuleId: 'rule-1',
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () =>
        of({
          amount: -40,
          type: 'expense',
          date: '2026-08-15T00:00:00.000Z',
          categoryId: 'food',
          accountId: 'default',
          comment: '',
          transaction: tx,
          isRecurring: false,
          recurringDayOfMonth: 18,
        }),
    });

    service.openEditDialog(expenseCategory, tx);

    expect(mockTransactionState.editTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-3' }),
      { isRecurring: false, dayOfMonth: 18 },
    );
  });
});
