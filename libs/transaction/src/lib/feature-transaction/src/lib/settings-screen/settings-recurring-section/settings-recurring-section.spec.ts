// spec: docs/specs/transaction/recurring-transactions.md

import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { SettingsRecurringSectionComponent } from './settings-recurring-section';
import {
  CategoryService,
  RecurringRuleService,
  RecurringTransactionRule,
} from '@data-access-transaction';
import { CurrencyService } from '@currency';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('SettingsRecurringSectionComponent', () => {
  let mockRulesSignal: ReturnType<typeof signal<RecurringTransactionRule[]>>;
  let mockTotalAmountSignal: ReturnType<typeof signal<number>>;

  let mockRecurringService: {
    getRulesAsync: ReturnType<typeof vi.fn>;
    rules: unknown;
    totalMonthlyAmount: unknown;
    addRuleAsync: ReturnType<typeof vi.fn>;
    updateRuleAsync: ReturnType<typeof vi.fn>;
    deleteRuleAsync: ReturnType<typeof vi.fn>;
    toggleRuleActiveAsync: ReturnType<typeof vi.fn>;
  };

  const sampleRules: RecurringTransactionRule[] = [
    {
      id: 'rule-rent',
      amount: 2500,
      categoryId: 'housing',
      accountId: 'default',
      comment: 'Czynsz za mieszkanie',
      dayOfMonth: 10,
      startDate: '2026-01-01',
      lastGeneratedMonth: '2026-11',
      isActive: true,
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'rule-spotify',
      amount: 30,
      categoryId: 'entertainment',
      accountId: 'default',
      comment: 'Spotify',
      dayOfMonth: 1,
      startDate: '2026-01-01',
      lastGeneratedMonth: '2026-11',
      isActive: false,
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    mockRulesSignal = signal([...sampleRules]);
    mockTotalAmountSignal = signal(2500);

    mockRecurringService = {
      getRulesAsync: vi.fn().mockResolvedValue(sampleRules),
      rules: mockRulesSignal.asReadonly(),
      totalMonthlyAmount: mockTotalAmountSignal.asReadonly(),
      addRuleAsync: vi.fn().mockResolvedValue(sampleRules[0]),
      updateRuleAsync: vi.fn().mockResolvedValue(sampleRules[0]),
      deleteRuleAsync: vi.fn().mockResolvedValue(undefined),
      toggleRuleActiveAsync: vi.fn().mockResolvedValue(undefined),
    };
  });

  const renderComponent = async () => {
    return render(SettingsRecurringSectionComponent, {
      providers: [
        { provide: RecurringRuleService, useValue: mockRecurringService },
        {
          provide: CategoryService,
          useValue: {
            getCategoriesAsync: vi.fn().mockResolvedValue([
              { id: 'housing', name: 'Mieszkanie', colorHex: '#3b82f6', icon: 'home' },
              { id: 'entertainment', name: 'Rozrywka', colorHex: '#ec4899', icon: 'movie' },
            ]),
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            format: (amount: number) => `${amount.toFixed(2)} zł`,
          },
        },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });
  };

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should render recurring rules list and total amount', async () => {
    await renderComponent();

    expect(screen.getByTestId('settings-recurring-section')).toBeInTheDocument();
    expect(screen.getByText('Czynsz za mieszkanie')).toBeInTheDocument();
    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByTestId('recurring-total-amount')).toHaveTextContent('2500.00 zł');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should toggle active status when switch is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const toggles = screen.getAllByRole('switch');
    expect(toggles.length).toBe(2);

    await user.click(toggles[0]);
    expect(mockRecurringService.toggleRuleActiveAsync).toHaveBeenCalledWith('rule-rent');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should call deleteRuleAsync when delete button is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const deleteBtns = screen.getAllByTestId('recurring-item-delete');
    await user.click(deleteBtns[0]);

    expect(mockRecurringService.deleteRuleAsync).toHaveBeenCalledWith('rule-rent');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should show empty state when there are no rules', async () => {
    mockRulesSignal.set([]);
    mockTotalAmountSignal.set(0);

    await renderComponent();

    expect(screen.getByTestId('recurring-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('recurring-list')).not.toBeInTheDocument();
  });
});
