import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LocalDbService } from 'local-db';
import { Category } from '../model/category.type';
import { CategoryStore } from './category-store';

const mockCategories: Category[] = [
  {
    id: 'food', name: 'Jedzenie', colorHex: '#16A34A', icon: 'restaurant',
    sortOrder: 10, isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'transport', name: 'Transport', colorHex: '#2563EB', icon: 'directions_car',
    sortOrder: 20, isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('CategoryStore', () => {
  let store: CategoryStore;
  let tableMock: {
    orderBy: ReturnType<typeof vi.fn>;
    toArray: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    bulkPut: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    tableMock = {
      orderBy: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockCategories) }),
      toArray: vi.fn().mockResolvedValue(mockCategories),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(2),
    };

    const dbMock = {
      table: vi.fn().mockReturnValue(tableMock),
    };

    TestBed.configureTestingModule({
      providers: [
        CategoryStore,
        { provide: LocalDbService, useValue: { getTable: () => dbMock.table() } },
      ],
    });

    store = TestBed.inject(CategoryStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should get categories sorted by sortOrder', async () => {
    const result = await firstValueFrom(store.getCategories());
    expect(result).toEqual(mockCategories);
    expect(tableMock.orderBy).toHaveBeenCalledWith('sortOrder');
  });

  it('should update a category via put', async () => {
    const updated: Category = {
      ...mockCategories[0],
      name: 'Jedzenie i picie',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };
    await store.updateCategoryAsync(updated);
    expect(tableMock.put).toHaveBeenCalledWith(updated);
  });

  it('should create a category via put', async () => {
    const created: Category = {
      id: 'new-cat', name: 'Nowa', colorHex: '#000', icon: 'star',
      sortOrder: 99, isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    };
    await store.createCategoryAsync(created);
    expect(tableMock.put).toHaveBeenCalledWith(created);
  });

  it('should delete a category by id', async () => {
    await store.deleteCategoryAsync('food');
    expect(tableMock.delete).toHaveBeenCalledWith('food');
  });

  it('should reorder categories via bulkPut', async () => {
    const reordered = [...mockCategories].reverse();
    await store.reorderCategoriesAsync(reordered);
    expect(tableMock.bulkPut).toHaveBeenCalledWith(reordered);
  });
});