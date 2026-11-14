// spec: docs/specs/transaction/recurring-transactions.md
import { TestBed } from '@angular/core/testing';
import { RecurringRuleService } from './recurring-rule.service';
import { RecurringRuleStore } from './recurring-rule-store';
import { RecurringTransactionRule } from '../model/recurring-rule.type';

describe('RecurringRuleService', () => {
  let service: RecurringRuleService;
  let ruleStoreMock: Partial<RecurringRuleStore>;
  let mockRules: RecurringTransactionRule[];

  beforeEach(() => {
    mockRules = [
      {
        id: 'r1',
        amount: 100,
        categoryId: 'cat1',
        accountId: 'acc1',
        dayOfMonth: 1,
        startDate: '2026-11-01',
        lastGeneratedMonth: '2026-11',
        isActive: true,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'r2',
        amount: 250,
        categoryId: 'cat2',
        accountId: 'acc1',
        dayOfMonth: 10,
        startDate: '2026-11-10',
        lastGeneratedMonth: '2026-11',
        isActive: false, // Inactive
        updatedAt: '2026-11-10T00:00:00.000Z',
      },
    ];

    ruleStoreMock = {
      getRulesAsync: vi.fn(async () => [...mockRules]),
      addRuleAsync: vi.fn(async (rule) => {
        mockRules.push(rule);
        return rule;
      }),
      updateRuleAsync: vi.fn(async (rule) => {
        const idx = mockRules.findIndex((r) => r.id === rule.id);
        if (idx >= 0) {
          mockRules[idx] = rule;
        }
        return rule;
      }),
      deleteRuleAsync: vi.fn(async (id) => {
        mockRules = mockRules.filter((r) => r.id !== id);
      }),
    };

    TestBed.configureTestingModule({
      providers: [RecurringRuleService, { provide: RecurringRuleStore, useValue: ruleStoreMock }],
    });

    service = TestBed.inject(RecurringRuleService);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should calculate totalMonthlyAmount for active non-deleted rules only', async () => {
    await service.getRulesAsync();
    // Only r1 is active (100 PLN), r2 is inactive (250 PLN)
    expect(service.totalMonthlyAmount()).toBe(100);
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-4
  it('should toggle rule active state and recalculate totalMonthlyAmount', async () => {
    await service.getRulesAsync();
    await service.toggleRuleActiveAsync('r2');

    expect(service.rules().find((r) => r.id === r2Id)?.isActive).toBe(true);
    expect(service.totalMonthlyAmount()).toBe(350);
  });

  const r2Id = 'r2';
});
