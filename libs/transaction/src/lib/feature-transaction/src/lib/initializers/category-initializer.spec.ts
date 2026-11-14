import { TestBed } from '@angular/core/testing';
import {
  CategoryStore,
  MOCK_PL_CATEGORIES,
  RecurringTransactionGeneratorService,
} from '@data-access-transaction';
import { of, throwError } from 'rxjs';
import { initializeCategoriesFactory } from './category-initializer';

describe('categoryInitializer', () => {
  let seedCategoriesSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    seedCategoriesSpy = vi.fn().mockReturnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoryStore,
          useValue: {
            seedCategoriesIfEmpty: seedCategoriesSpy,
          },
        },
      ],
    });
  });

  it('should seed the default categories', async () => {
    const categoryStore = TestBed.inject(CategoryStore);

    await initializeCategoriesFactory(categoryStore)();

    expect(seedCategoriesSpy).toHaveBeenCalledOnce();
    expect(seedCategoriesSpy).toHaveBeenCalledWith(MOCK_PL_CATEGORIES);
  });

  it('should return a promise that resolves after seeding', async () => {
    const categoryStore = TestBed.inject(CategoryStore);

    await expect(initializeCategoriesFactory(categoryStore)()).resolves.toBeUndefined();
  });

  it('should log a warning without rejecting when seeding fails', async () => {
    const error = new Error('Seeding failed');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    seedCategoriesSpy.mockReturnValue(throwError(() => error));
    const categoryStore = TestBed.inject(CategoryStore);

    await expect(initializeCategoriesFactory(categoryStore)()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to seed categories'),
      error,
    );

    warnSpy.mockRestore();
  });

  // covers: docs/specs/transaction/recurring-transactions.md#AC-2
  it('should call generatePendingTransactions on startup if recurringGenerator is provided', async () => {
    const categoryStore = TestBed.inject(CategoryStore);
    const mockRecurringGen = {
      generatePendingTransactions: vi.fn().mockResolvedValue([]),
    };

    await initializeCategoriesFactory(
      categoryStore,
      mockRecurringGen as unknown as RecurringTransactionGeneratorService,
    )();

    expect(mockRecurringGen.generatePendingTransactions).toHaveBeenCalledOnce();
  });
});
