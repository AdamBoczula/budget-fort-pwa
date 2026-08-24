import { TestBed } from '@angular/core/testing';
import {
  CategoryStore,
  DEFAULT_SUBCATEGORIES,
  MOCK_PL_CATEGORIES,
  SubcategoryStore,
} from '@data-access-transaction';
import { of, throwError } from 'rxjs';
import { initializeCategoriesFactory } from './category-initializer';

describe('categoryInitializer', () => {
  let seedCategoriesSpy: ReturnType<typeof vi.fn>;
  let seedSubcategoriesSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    seedCategoriesSpy = vi.fn().mockReturnValue(of(void 0));
    seedSubcategoriesSpy = vi.fn().mockReturnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoryStore,
          useValue: {
            seedCategoriesIfEmpty: seedCategoriesSpy,
          },
        },
        {
          provide: SubcategoryStore,
          useValue: {
            seedSubcategoriesIfEmpty: seedSubcategoriesSpy,
          },
        },
      ],
    });
  });

  it('should seed the default categories', async () => {
    const categoryStore = TestBed.inject(CategoryStore);
    const subcategoryStore = TestBed.inject(SubcategoryStore);

    await initializeCategoriesFactory(categoryStore, subcategoryStore)();

    expect(seedCategoriesSpy).toHaveBeenCalledOnce();
    expect(seedCategoriesSpy).toHaveBeenCalledWith(MOCK_PL_CATEGORIES);
  });

  it('should seed the default subcategories', async () => {
    const categoryStore = TestBed.inject(CategoryStore);
    const subcategoryStore = TestBed.inject(SubcategoryStore);

    await initializeCategoriesFactory(categoryStore, subcategoryStore)();

    expect(seedSubcategoriesSpy).toHaveBeenCalledOnce();
    expect(seedSubcategoriesSpy).toHaveBeenCalledWith(DEFAULT_SUBCATEGORIES);
  });

  it('should return a promise that resolves after seeding', async () => {
    const categoryStore = TestBed.inject(CategoryStore);
    const subcategoryStore = TestBed.inject(SubcategoryStore);

    await expect(
      initializeCategoriesFactory(categoryStore, subcategoryStore)(),
    ).resolves.toBeUndefined();
  });

  it('should log a warning without rejecting when seeding fails', async () => {
    const error = new Error('Seeding failed');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    seedCategoriesSpy.mockReturnValue(throwError(() => error));
    const categoryStore = TestBed.inject(CategoryStore);
    const subcategoryStore = TestBed.inject(SubcategoryStore);

    await expect(
      initializeCategoriesFactory(categoryStore, subcategoryStore)(),
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
      'Failed to seed categories:',
      error,
    );

    warnSpy.mockRestore();
  });
});