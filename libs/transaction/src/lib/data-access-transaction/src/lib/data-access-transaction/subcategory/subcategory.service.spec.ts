import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubcategoryService } from './subcategory.service';
import { SubcategoryStore } from './subcategory-store';

const mockStore = {
  getSubcategories: vi.fn().mockReturnValue(of([])),
  getSubcategoriesAsync: vi.fn().mockResolvedValue([]),
  upsertSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
  updateSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
  deleteSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
};

describe('SubcategoryService', () => {
  let service: SubcategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        SubcategoryService,
        { provide: SubcategoryStore, useValue: mockStore },
      ],
    });

    service = TestBed.inject(SubcategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normalize and return subcategories', async () => {
    mockStore.getSubcategoriesAsync.mockResolvedValue([
      { id: '1', categoryId: 'transport', name: 'Samochód' },
      { id: '2', categoryId: 'transport', name: 'samochód' },
      { id: '3', categoryId: 'transport', name: 'Naprawa' },
    ]);

    const result = await service.getSubcategoriesAsync('transport');
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name)).toEqual(['Samochód', 'Naprawa']);
  });

  it('should upsert a subcategory', async () => {
    await service.upsertSubcategoryAsync('transport', 'Myjnia');
    expect(mockStore.upsertSubcategoryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'transport', name: 'Myjnia' }),
    );
  });

  it('should not upsert empty subcategory', async () => {
    await service.upsertSubcategoryAsync('transport', '   ');
    expect(mockStore.upsertSubcategoryAsync).not.toHaveBeenCalled();
  });

  it('should update a subcategory via store', async () => {
    const sub = { id: 'sub-1', categoryId: 'transport', name: 'Samochód osobowy' };
    await service.updateSubcategoryAsync(sub);
    expect(mockStore.updateSubcategoryAsync).toHaveBeenCalledWith(sub);
  });

  it('should delete a subcategory via store', async () => {
    await service.deleteSubcategoryAsync('sub-1');
    expect(mockStore.deleteSubcategoryAsync).toHaveBeenCalledWith('sub-1');
  });
});
