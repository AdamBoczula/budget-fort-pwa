import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Category } from '../model/category.type';
import { CategoryService } from './category.service';
import { CategoryStore } from './category-store';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategories: Category[] = [
    {
      id: 'food', name: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant',
      sortOrder: 10, isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'income', name: 'Zarobek', colorHex: '#10B981', icon: 'savings',
      sortOrder: 5, isHidden: false, transactionType: 'income',
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'hidden', name: 'Hidden Category', colorHex: '#000', icon: 'block',
      sortOrder: 999, isHidden: true,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const categoryStoreMock = {
    seedCategoriesIfEmpty: () => of(void 0),
    getCategories: () => of(mockCategories),
    createCategoryAsync: vi.fn().mockResolvedValue(undefined),
    updateCategoryAsync: vi.fn().mockResolvedValue(undefined),
    deleteCategoryAsync: vi.fn().mockResolvedValue(undefined),
    reorderCategoriesAsync: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryStore, useValue: categoryStoreMock },
      ],
    });
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all categories', async () => {
    const categories = await firstValueFrom(service.getCategories());
    expect(categories.length).toBe(3);
  });

  it('should filter hidden and income categories from visible list', async () => {
    const categories = await firstValueFrom(service.getVisibleCategories());
    expect(categories.length).toBe(1);
    expect(categories.every((c) => !c.isHidden && c.transactionType !== 'income')).toBe(true);
    expect(categories[0].id).toBe('food');
  });

  it('should include income category with transactionType set', async () => {
    const categories = await firstValueFrom(service.getCategories());
    const income = categories.find((c) => c.id === 'income');
    expect(income).toBeDefined();
    expect(income!.transactionType).toBe('income');
  });

  it('should default expense categories to no transactionType', async () => {
    const categories = await firstValueFrom(service.getCategories());
    const food = categories.find((c) => c.id === 'food');
    expect(food).toBeDefined();
    expect(food!.transactionType).toBeUndefined();
  });

  it('should create a category via store', async () => {
    const newCat: Category = {
      id: 'new-cat', name: 'Nowa', colorHex: '#000', icon: 'star',
      sortOrder: 99, isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    };
    await service.createCategoryAsync(newCat);
    expect(categoryStoreMock.createCategoryAsync).toHaveBeenCalledWith(newCat);
  });

  it('should update a category via store', async () => {
    const updated: Category = { ...mockCategories[0], name: 'Zmieniona' };
    await service.updateCategoryAsync(updated);
    expect(categoryStoreMock.updateCategoryAsync).toHaveBeenCalledWith(updated);
  });

  it('should delete a category via store', async () => {
    await service.deleteCategoryAsync('food');
    expect(categoryStoreMock.deleteCategoryAsync).toHaveBeenCalledWith('food');
  });

  it('should reorder categories via store', async () => {
    const reordered = [...mockCategories].reverse();
    await service.reorderCategoriesAsync(reordered);
    expect(categoryStoreMock.reorderCategoriesAsync).toHaveBeenCalledWith(reordered);
  });
});