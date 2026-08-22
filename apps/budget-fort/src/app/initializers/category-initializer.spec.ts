import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { CategoryStore, MOCK_PL_CATEGORIES } from '@data-access-transaction';

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

  it('should call seedCategoriesIfEmpty with MOCK_PL_CATEGORIES', async () => {
    const { initializeCategoriesFactory } = await import(
      './category-initializer'
    );

    const categoryStore = TestBed.inject(CategoryStore);
    const initFn = initializeCategoriesFactory(categoryStore);

    await initFn();

    expect(seedSpy).toHaveBeenCalledWith(MOCK_PL_CATEGORIES);
    expect(seedSpy).toHaveBeenCalledTimes(1);
  });

  it('should convert seedCategoriesIfEmpty Observable to Promise', async () => {
    const { initializeCategoriesFactory } = await import(
      './category-initializer'
    );

    const categoryStore = TestBed.inject(CategoryStore);
    const initFn = initializeCategoriesFactory(categoryStore);

    const result = initFn();

    await expect(result).resolves.toBeUndefined();
  });

  it('should reject Promise when seedCategoriesIfEmpty errors', async () => {
    const errorMessage = 'Seeding failed';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoryStore,
          useValue: {
            seedCategoriesIfEmpty: vi.fn().mockReturnValue({
              subscribe: (callbacks: {
                next?: () => void;
                error?: (err: unknown) => void;
              }) => {
                callbacks.error?.(new Error(errorMessage));
              },
            }),
          },
        },
      ],
    });

    const { initializeCategoriesFactory } = await import(
      './category-initializer'
    );

    const categoryStore = TestBed.inject(CategoryStore);
    const initFn = initializeCategoriesFactory(categoryStore);

    await expect(initFn()).rejects.toThrow(errorMessage);
  });
});