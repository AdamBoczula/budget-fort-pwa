import { TestBed } from '@angular/core/testing';
import { CategoryStore, MOCK_PL_CATEGORIES } from '@data-access-transaction';
import { of, throwError } from 'rxjs';
import { initializeCategoriesFactory } from './category-initializer';

describe('categoryInitializer', () => {
  let seedSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    seedSpy = vi.fn().mockReturnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoryStore,
          useValue: {
            seedCategoriesIfEmpty: seedSpy,
          },
        },
      ],
    });
  });

  it('should seed the default categories', async () => {
    const categoryStore = TestBed.inject(CategoryStore);

    await initializeCategoriesFactory(categoryStore)();

    expect(seedSpy).toHaveBeenCalledExactlyOnceWith(MOCK_PL_CATEGORIES);
  });

  it('should return a promise that resolves after seeding', async () => {
    const categoryStore = TestBed.inject(CategoryStore);

    await expect(
      initializeCategoriesFactory(categoryStore)(),
    ).resolves.toBeUndefined();
  });

  it('should log a warning without rejecting when seeding fails', async () => {
    const error = new Error('Seeding failed');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    seedSpy.mockReturnValue(throwError(() => error));
    const categoryStore = TestBed.inject(CategoryStore);

    await expect(
      initializeCategoriesFactory(categoryStore)(),
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
      'Failed to seed categories:',
      error,
    );

    warnSpy.mockRestore();
  });
});