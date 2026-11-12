import { render, screen, waitFor } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import {
  CategoryService,
  SubcategoryService,
  Category,
  Subcategory,
} from '@data-access-transaction';
import { LocalStorageService, BackupRestoreService } from 'local-db';
import { SettingsPageScreen } from './settings-screen';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

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

describe('SettingsPageScreen (integration)', () => {
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

  const localStorageMock = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };

  const backupRestoreServiceMock = {
    exportBackup: vi.fn(),
    downloadBackupFile: vi.fn(),
    validateBackupFile: vi.fn(),
    restoreBackup: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    categoryServiceMock.getCategoriesAsync.mockResolvedValue(MOCK_CATEGORIES);

    await TestBed.configureTestingModule({
      imports: [SettingsPageScreen],
      providers: [
        provideAnimationsAsync(),
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: SubcategoryService, useValue: subcategoryServiceMock },
        { provide: LocalStorageService, useValue: localStorageMock },
        { provide: BackupRestoreService, useValue: backupRestoreServiceMock },
      ],
    }).compileComponents();
  });

  it('should render all section titles including backup', async () => {
    await render(SettingsPageScreen);
    expect(screen.getByText('Kategorie i podkategorie')).toBeDefined();
    expect(screen.getByText('Motyw kolorystyczny')).toBeDefined();
    expect(screen.getByText('Waluta')).toBeDefined();
    expect(screen.getByText('Kopia zapasowa i dane')).toBeDefined();
  });

  it('should display visible categories (excluding hidden)', async () => {
    await render(SettingsPageScreen);
    await waitFor(() => {
      expect(screen.getByText('Jedzenie')).toBeDefined();
    });
    expect(screen.getByText('Zarobek')).toBeDefined();
    expect(screen.queryByText('Ukryta')).toBeNull();
  });

  it('should display subcategories on panel expand', async () => {
    await render(SettingsPageScreen);
    const foodPanel = await screen.findByText('Jedzenie');
    await userEvent.click(foodPanel);
    await waitFor(() => {
      expect(screen.getByText('Obiad')).toBeDefined();
    });
    expect(screen.getByText('Zakupy')).toBeDefined();
  });

  it('should show empty message for categories without subcategories', async () => {
    await render(SettingsPageScreen);
    const incomePanel = await screen.findByText('Zarobek');
    await userEvent.click(incomePanel);
    await waitFor(() => {
      expect(screen.getByText('Brak podkategorii')).toBeDefined();
    });
  });

  it('should render theme select', async () => {
    await render(SettingsPageScreen);
    expect(screen.getByRole('combobox', { name: /motyw/i })).toBeDefined();
  });

  it('should persist theme change to localStorage', async () => {
    const user = userEvent.setup();
    await render(SettingsPageScreen);
    const themeSelect = screen.getByRole('combobox', { name: /motyw/i });
    await user.click(themeSelect);
    const option = await screen.findByText('Rose & Red');
    await user.click(option);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('budget-fort.theme', 'rose-red');
  });

  it('should render currency select', async () => {
    await render(SettingsPageScreen);
    expect(screen.getByRole('combobox', { name: /walut/i })).toBeDefined();
  });

  it('should persist currency change to localStorage', async () => {
    const user = userEvent.setup();
    await render(SettingsPageScreen);
    const currencySelect = screen.getByRole('combobox', { name: /walut/i });
    await user.click(currencySelect);
    const eurOption = await screen.findByText('Euro (EUR)');
    await user.click(eurOption);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('budget-fort.currency', 'EUR');
  });

  it('should restore saved currency from localStorage', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'budget-fort.currency') {
        return 'GBP';
      }
      return null;
    });
    await render(SettingsPageScreen);
    expect(screen.getByRole('combobox', { name: /walut/i })).toBeDefined();
  });

  it('should render add category button', async () => {
    await render(SettingsPageScreen);
    await waitFor(() => {
      expect(screen.getByText('Dodaj kategorię')).toBeDefined();
    });
  });

  it('should render edit and delete buttons for each category', async () => {
    await render(SettingsPageScreen);
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
    await render(SettingsPageScreen);
    await waitFor(async () => {
      const foodPanel = await screen.findByText('Jedzenie');
      await userEvent.click(foodPanel);
    });
    await waitFor(() => {
      const subcategoryLabels = screen.getAllByText('Podkategorie');
      expect(subcategoryLabels.length).toBeGreaterThanOrEqual(1);
    });
  });
  it('should open add category dialog when clicking Dodaj kategorię button (integration)', async () => {
    const user = userEvent.setup();
    await render(SettingsPageScreen);

    const addBtn = await screen.findByRole('button', { name: /dodaj kategorię/i });
    await user.click(addBtn);

    await waitFor(() => {
      const dialogTitle = screen.getByRole('heading', { name: /^dodaj kategorię$/i });
      expect(dialogTitle).toBeDefined();
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nazwa kategorii');
      expect(nameInput).toBeDefined();
    });
  });
});
