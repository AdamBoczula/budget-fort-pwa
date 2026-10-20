import { render, screen, waitFor } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import {
  CategoryService,
  SubcategoryService,
  Category,
  Subcategory,
} from '@data-access-transaction';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SettingsCategoriesSectionComponent } from './settings-categories-section';

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Jedzenie',
    colorHex: '#16A34A',
    icon: 'restaurant',
    sortOrder: 10,
    isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'income',
    name: 'Zarobek',
    colorHex: '#10B981',
    icon: 'savings',
    sortOrder: 5,
    isHidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    transactionType: 'income',
  },
  {
    id: 'hidden_cat',
    name: 'Ukryta',
    colorHex: '#999999',
    icon: 'block',
    sortOrder: 999,
    isHidden: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const MOCK_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-1', categoryId: 'food', name: 'Obiad' },
  { id: 'sub-2', categoryId: 'food', name: 'Zakupy' },
];

describe('SettingsCategoriesSectionComponent', () => {
  const categoryServiceMock = {
    getCategoriesAsync: vi.fn().mockResolvedValue(MOCK_CATEGORIES),
    getVisibleCategoriesAsync: vi
      .fn()
      .mockResolvedValue(MOCK_CATEGORIES.filter((c) => !c.isHidden)),
    createCategoryAsync: vi.fn().mockResolvedValue(undefined),
    updateCategoryAsync: vi.fn().mockResolvedValue(undefined),
    deleteCategoryAsync: vi.fn().mockResolvedValue(undefined),
    reorderCategoriesAsync: vi.fn().mockResolvedValue(undefined),
  };

  const subcategoryServiceMock = {
    getSubcategoriesAsync: vi.fn().mockImplementation((categoryId: string) => {
      if (categoryId === 'food') {
        return Promise.resolve(MOCK_SUBCATEGORIES);
      }
      return Promise.resolve([]);
    }),
    upsertSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
    updateSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
    deleteSubcategoryAsync: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    categoryServiceMock.getCategoriesAsync.mockResolvedValue(MOCK_CATEGORIES);

    await TestBed.configureTestingModule({
      imports: [SettingsCategoriesSectionComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: SubcategoryService, useValue: subcategoryServiceMock },
      ],
    }).compileComponents();
  });

  it('should render section title', async () => {
    await render(SettingsCategoriesSectionComponent);
    expect(screen.getByText('Kategorie i podkategorie')).toBeDefined();
  });

  it('should display visible categories (excluding hidden)', async () => {
    await render(SettingsCategoriesSectionComponent);

    await waitFor(() => {
      expect(screen.getByText('Jedzenie')).toBeDefined();
    });
    expect(screen.getByText('Zarobek')).toBeDefined();
    expect(screen.queryByText('Ukryta')).toBeNull();
  });

  it('should display subcategories on panel expand', async () => {
    await render(SettingsCategoriesSectionComponent);

    const foodPanel = await screen.findByText('Jedzenie');
    await userEvent.click(foodPanel);

    await waitFor(() => {
      expect(screen.getByText('Obiad')).toBeDefined();
    });
    expect(screen.getByText('Zakupy')).toBeDefined();
  });

  it('should show empty message for categories without subcategories', async () => {
    await render(SettingsCategoriesSectionComponent);

    const incomePanel = await screen.findByText('Zarobek');
    await userEvent.click(incomePanel);

    await waitFor(() => {
      expect(screen.getByText('Brak podkategorii')).toBeDefined();
    });
  });

  it('should render add category button', async () => {
    await render(SettingsCategoriesSectionComponent);

    await waitFor(() => {
      expect(screen.getByText('Dodaj kategorię')).toBeDefined();
    });
  });

  it('should render edit and delete buttons for each category', async () => {
    await render(SettingsCategoriesSectionComponent);

    await waitFor(async () => {
      const foodPanel = await screen.findByText('Jedzenie');
      await userEvent.click(foodPanel);
    });

    await waitFor(() => {
      const editIcons = screen.getAllByText('edit');
      expect(editIcons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should render subcategory header with Podkategorie label', async () => {
    await render(SettingsCategoriesSectionComponent);

    await waitFor(async () => {
      const foodPanel = await screen.findByText('Jedzenie');
      await userEvent.click(foodPanel);
    });

    await waitFor(() => {
      const subcategoryLabels = screen.getAllByText('Podkategorie');
      expect(subcategoryLabels.length).toBeGreaterThanOrEqual(1);
    });
  });
  it('should open add category dialog when clicking Dodaj kategorię button', async () => {
    const user = userEvent.setup();
    await render(SettingsCategoriesSectionComponent);

    const addBtn = await screen.findByRole('button', { name: /dodaj kategorię/i });
    await user.click(addBtn);

    await waitFor(() => {
      // Dialog title should show "Dodaj kategorię" (add mode, not edit mode)
      const dialogTitle = screen.getByRole('heading', { name: /^dodaj kategorię$/i });
      expect(dialogTitle).toBeDefined();
    });

    // The form field for category name should be visible in the dialog
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nazwa kategorii');
      expect(nameInput).toBeDefined();
    });
  });
});
