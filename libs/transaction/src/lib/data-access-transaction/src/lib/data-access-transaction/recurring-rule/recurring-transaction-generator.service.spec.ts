// spec: docs/specs/transaction/recurring-transactions.md
import { TestBed } from '@angular/core/testing';
import { RecurringTransactionGeneratorService } from './recurring-transaction-generator.service';
import { RecurringRuleStore } from './recurring-rule-store';
import { TransactionStore } from '../transaction/transaction-store';
import { RecurringTransactionRule } from '../model/recurring-rule.type';
import { Transaction } from '../model/transaction.type';

describe('RecurringTransactionGeneratorService', () => {
  let service: RecurringTransactionGeneratorService;
  let ruleStoreMock: Partial<RecurringRuleStore>;
  let transactionStoreMock: Partial<TransactionStore>;

  let rules: RecurringTransactionRule[];
  let transactions: Transaction[];

  beforeEach(() => {
    rules = [];
    transactions = [];

    ruleStoreMock = {
      getActiveRulesAsync: vi.fn(async () => rules.filter((r) => r.isActive && !r.isDeleted)),
      updateRuleAsync: vi.fn(async (rule) => {
        const index = rules.findIndex((r) => r.id === rule.id);
        if (index >= 0) {
          rules[index] = rule;
        }
        return rule;
      }),
    };

    transactionStoreMock = {
      getTransactionsAsync: vi.fn(async () => transactions),
      addTransactionAsync: vi.fn(async (tx) => {
        transactions.push(tx);
        return tx;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        RecurringTransactionGeneratorService,
        { provide: RecurringRuleStore, useValue: ruleStoreMock },
        { provide: TransactionStore, useValue: transactionStoreMock },
      ],
    });

    service = TestBed.inject(RecurringTransactionGeneratorService);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  it('should generate transaction with deterministic id rec_${ruleId}_${yearMonth}', async () => {
    rules.push({
      id: 'netflix-rule',
      amount: 49,
      categoryId: 'cat-subs',
      accountId: 'default',
      dayOfMonth: 1,
      startDate: '2026-10-01',
      lastGeneratedMonth: '2026-10',
      isActive: true,
      updatedAt: '2026-10-01T00:00:00.000Z',
    });

    const targetDate = new Date(2026, 10, 1); // 2026-11-01
    const generated = await service.generatePendingTransactions(targetDate);

    expect(generated.length).toBe(1);
    expect(generated[0].id).toBe('rec_netflix-rule_2026-11');
    expect(generated[0].amount).toBe(49);
    expect(generated[0].date).toBe('2026-11-01');
    expect(generated[0].recurringRuleId).toBe('netflix-rule');
    expect(ruleStoreMock.updateRuleAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'netflix-rule',
        lastGeneratedMonth: '2026-11',
      }),
    );
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  it('should not duplicate transactions when run multiple times (idempotency)', async () => {
    rules.push({
      id: 'rent-rule',
      amount: 2500,
      categoryId: 'cat-housing',
      accountId: 'default',
      dayOfMonth: 5,
      startDate: '2026-10-05',
      lastGeneratedMonth: '2026-10',
      isActive: true,
      updatedAt: '2026-10-05T00:00:00.000Z',
    });

    const targetDate = new Date(2026, 10, 5); // 2026-11-05
    const firstRun = await service.generatePendingTransactions(targetDate);
    expect(firstRun.length).toBe(1);

    // Second run with the same target date:
    const secondRun = await service.generatePendingTransactions(targetDate);
    expect(secondRun.length).toBe(0);
    expect(transactions.length).toBe(1);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-3
  it('should not generate transaction if current day has not reached rule dayOfMonth (Option A)', async () => {
    rules.push({
      id: 'gym-rule',
      amount: 120,
      categoryId: 'cat-sport',
      accountId: 'default',
      dayOfMonth: 20,
      startDate: '2026-10-20',
      lastGeneratedMonth: '2026-10',
      isActive: true,
      updatedAt: '2026-10-20T00:00:00.000Z',
    });

    const targetDateBeforeDue = new Date(2026, 10, 10); // 2026-11-10 (before 20th)
    const generated = await service.generatePendingTransactions(targetDateBeforeDue);

    expect(generated.length).toBe(0);
    expect(transactions.length).toBe(0);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-3
  it('should generate transaction when current day reaches rule dayOfMonth', async () => {
    rules.push({
      id: 'gym-rule',
      amount: 120,
      categoryId: 'cat-sport',
      accountId: 'default',
      dayOfMonth: 20,
      startDate: '2026-10-20',
      lastGeneratedMonth: '2026-10',
      isActive: true,
      updatedAt: '2026-10-20T00:00:00.000Z',
    });

    const targetDateOnDue = new Date(2026, 10, 20); // 2026-11-20
    const generated = await service.generatePendingTransactions(targetDateOnDue);

    expect(generated.length).toBe(1);
    expect(generated[0].id).toBe('rec_gym-rule_2026-11');
    expect(generated[0].date).toBe('2026-11-20');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#EdgeCase-1
  it('should clamp dayOfMonth to the last day of shorter months (e.g. Feb 28th)', async () => {
    rules.push({
      id: 'end-of-month-rule',
      amount: 200,
      categoryId: 'cat-bills',
      accountId: 'default',
      dayOfMonth: 31,
      startDate: '2027-01-31',
      lastGeneratedMonth: '2027-01',
      isActive: true,
      updatedAt: '2027-01-31T00:00:00.000Z',
    });

    const targetDateInFeb = new Date(2027, 1, 28); // 2027-02-28 (non-leap year, 28 days)
    const generated = await service.generatePendingTransactions(targetDateInFeb);

    expect(generated.length).toBe(1);
    expect(generated[0].id).toBe('rec_end-of-month-rule_2027-02');
    expect(generated[0].date).toBe('2027-02-28');
  });

  // covers: docs/specs/transaction/recurring-transactions.md#EdgeCase-2
  it('should perform catch-up for multiple missed months when user was absent', async () => {
    rules.push({
      id: 'spotify-rule',
      amount: 30,
      categoryId: 'cat-entertainment',
      accountId: 'default',
      dayOfMonth: 1,
      startDate: '2026-07-01',
      lastGeneratedMonth: '2026-07',
      isActive: true,
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    // User didn't open the app until October 2nd:
    const targetDate = new Date(2026, 9, 2); // 2026-10-02
    const generated = await service.generatePendingTransactions(targetDate);

    // Should catch up August (08), September (09), and October (10)
    expect(generated.length).toBe(3);
    expect(generated.map((t) => t.date)).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
    expect(generated.map((t) => t.id)).toEqual([
      'rec_spotify-rule_2026-08',
      'rec_spotify-rule_2026-09',
      'rec_spotify-rule_2026-10',
    ]);
  });
});
