import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Category } from '../model/category.type';
import { CategoryService } from './category.service';
import { CategoryStore } from './category-store';

describe('CategoryService', () => {
  let service: CategoryService;

  const sortedMock: Category[] = [
    {
      id: 'a',
      name: 'A',
      colorHex: '#111111',
      icon: 'home',
      sortOrder: 10,
      isHidden: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'b',
      name: 'B',
      colorHex: '#222222',
      icon: 'movie',
      sortOrder: 20,
      isHidden: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const categoryStoreMock = {
    seedCategoriesIfEmpty: () => of(void 0),
    getCategories: () => of(sortedMock),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CategoryStore,
          useValue: categoryStoreMock,
        },
      ],
    });

    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return categories', async () => {
    const categories = await firstValueFrom(service.getCategories());

    expect(categories).toEqual(sortedMock);
  });

  it('should filter hidden categories from visible list', async () => {
    const categories = await firstValueFrom(service.getVisibleCategories());

    expect(categories).toEqual([sortedMock[0]]);
  });
});
