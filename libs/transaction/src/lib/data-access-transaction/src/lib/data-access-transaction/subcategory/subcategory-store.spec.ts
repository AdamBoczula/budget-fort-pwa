import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LocalDbService } from 'local-db';
import { SubcategoryStore } from './subcategory-store';

const mockSubcategories = [
  { id: 'sub-1', categoryId: 'transport', name: 'Samochód' },
  { id: 'sub-2', categoryId: 'transport', name: 'Naprawa' },
  { id: 'sub-3', categoryId: 'food', name: 'Biedronka' },
];

describe('SubcategoryStore', () => {
  let store: SubcategoryStore;
  let tableMock: { add: ReturnType<typeof vi.fn>; bulkPut: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; toArray: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tableMock = {
      add: vi.fn(),
      bulkPut: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      toArray: vi.fn().mockResolvedValue(mockSubcategories),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue(mockSubcategories.filter((s) => s.categoryId === 'transport')),
        }),
        first: vi.fn().mockResolvedValue(null),
      }),
    };

    const dbMock = {
      table: vi.fn().mockReturnValue(tableMock),
    };

    TestBed.configureTestingModule({
      providers: [
        SubcategoryStore,
        { provide: LocalDbService, useValue: { getTable: () => dbMock.table() } },
      ],
    });

    store = TestBed.inject(SubcategoryStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should get subcategories for a category', async () => {
    const result = await firstValueFrom(store.getSubcategories('transport'));
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Samochód');
    expect(result[1].name).toBe('Naprawa');
  });

  it('should add a new subcategory', async () => {
    const subcategory = { id: 'sub-new', categoryId: 'transport', name: 'Myjnia' };
    const result = await firstValueFrom(store.addSubcategory(subcategory));
    expect(tableMock.add).toHaveBeenCalledWith(subcategory);
    expect(result).toEqual(subcategory);
  });

  it('should upsert a subcategory when it does not exist', async () => {
    const subcategory = { id: 'sub-new', categoryId: 'transport', name: 'Myjnia' };
    await store.upsertSubcategoryAsync(subcategory);
    expect(tableMock.where).toHaveBeenCalledWith({ categoryId: 'transport', name: 'Myjnia' });
    expect(tableMock.add).toHaveBeenCalledWith(subcategory);
  });

  it('should not add duplicate subcategory on upsert', async () => {
    tableMock.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 'sub-1', categoryId: 'transport', name: 'Samochód' }),
    });

    const subcategory = { id: 'sub-new', categoryId: 'car', name: 'Paliwo' };
    await store.upsertSubcategoryAsync(subcategory);
    expect(tableMock.add).not.toHaveBeenCalled();
  });

  it('should update a subcategory via put', async () => {
    const updated = { id: 'sub-1', categoryId: 'transport', name: 'Samochód osobowy' };
    await store.updateSubcategoryAsync(updated);
    expect(tableMock.put).toHaveBeenCalledWith(updated);
  });

  it('should delete a subcategory by id', async () => {
    await store.deleteSubcategoryAsync('sub-1');
    expect(tableMock.delete).toHaveBeenCalledWith('sub-1');
  });
});
