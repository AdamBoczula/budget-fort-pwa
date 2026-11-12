// spec: docs/specs/settings/data-export-import.md

import {
  BackupRestoreService,
  BACKUP_CURRENCY_STORAGE_KEY,
  BACKUP_THEME_STORAGE_KEY,
} from './backup-restore.service';
import {
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  CATEGORY_DB_TOKEN,
  LocalDbService,
  SUBCATEGORY_DB_TOKEN,
  TRANSACTION_DB_TOKEN,
} from './local-db';
import { LocalStorageService } from './local-storage.service';
import { BackupFileEnvelope } from './backup-restore.types';

describe('BackupRestoreService', () => {
  let service: BackupRestoreService;

  const mockTables: Record<
    string,
    {
      toArray: ReturnType<typeof vi.fn>;
      clear: ReturnType<typeof vi.fn>;
      bulkAdd: ReturnType<typeof vi.fn>;
    }
  > = {
    [TRANSACTION_DB_TOKEN]: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
    [CATEGORY_DB_TOKEN]: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
    [SUBCATEGORY_DB_TOKEN]: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
    [BUDGET_DB_TOKEN]: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
    [CATEGORY_BUDGET_DB_TOKEN]: { toArray: vi.fn(), clear: vi.fn(), bulkAdd: vi.fn() },
  };

  const mockDb = {
    table: vi.fn((token: string) => mockTables[token]),
    transaction: vi.fn(async (_mode: string, _tables: string[], callback: () => Promise<void>) => {
      await callback();
    }),
  };

  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTables[TRANSACTION_DB_TOKEN].toArray.mockResolvedValue([
      { id: 'tx-1', amount: 150.5, date: '2026-11-10', categoryId: 'cat-1', accountId: 'acc-1' },
    ]);
    mockTables[CATEGORY_DB_TOKEN].toArray.mockResolvedValue([
      { id: 'cat-1', name: 'Jedzenie', sortOrder: 1, isHidden: false },
    ]);
    mockTables[SUBCATEGORY_DB_TOKEN].toArray.mockResolvedValue([
      { id: 'sub-1', categoryId: 'cat-1', name: 'Restauracje' },
    ]);
    mockTables[BUDGET_DB_TOKEN].toArray.mockResolvedValue([
      { id: 1, amount: 4500, updatedAt: '2026-11-01T12:00:00Z' },
    ]);
    mockTables[CATEGORY_BUDGET_DB_TOKEN].toArray.mockResolvedValue([
      {
        id: 10,
        categoryId: 'cat-1',
        categoryName: 'Jedzenie',
        amount: 1000,
        updatedAt: '2026-11-01T12:00:00Z',
      },
    ]);

    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === BACKUP_CURRENCY_STORAGE_KEY) {
        return 'EUR';
      }
      if (key === BACKUP_THEME_STORAGE_KEY) {
        return 'rose-red';
      }
      return null;
    });

    service = new BackupRestoreService(
      { getDatabase: () => mockDb } as unknown as LocalDbService,
      mockLocalStorage as unknown as LocalStorageService,
    );
  });

  // covers: docs/specs/settings/data-export-import.md#AC-1
  it('should export all database tables and settings into a valid BackupFileEnvelope', async () => {
    const backup = await service.exportBackup();

    expect(backup.schemaVersion).toBe(1);
    expect(backup.exportedAt).toBeTruthy();
    expect(backup.data.transactions).toHaveLength(1);
    expect(backup.data.transactions[0].id).toBe('tx-1');
    expect(backup.data.categories).toHaveLength(1);
    expect(backup.data.categories[0].name).toBe('Jedzenie');
    expect(backup.data.subcategories).toHaveLength(1);
    expect(backup.data.budgets).toHaveLength(1);
    expect(backup.data.categoryBudgets).toHaveLength(1);
    expect(backup.data.settings.currency).toBe('EUR');
    expect(backup.data.settings.theme).toBe('rose-red');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-5
  it('should restore database by clearing old tables and bulk adding new records', async () => {
    const envelope: BackupFileEnvelope = {
      schemaVersion: 1,
      exportedAt: '2026-11-11T10:00:00Z',
      data: {
        transactions: [
          {
            id: 'tx-new',
            amount: 99.99,
            date: '2026-11-11',
            categoryId: 'cat-new',
            accountId: 'acc-1',
          },
        ],
        categories: [{ id: 'cat-new', name: 'Zakupy' }],
        subcategories: [{ id: 'sub-new', categoryId: 'cat-new', name: 'Dom' }],
        budgets: [{ id: 1, amount: 6000, updatedAt: '2026-11-11T10:00:00Z' }],
        categoryBudgets: [
          { categoryId: 'cat-new', amount: 800, updatedAt: '2026-11-11T10:00:00Z' },
        ],
        settings: {
          currency: 'PLN',
          theme: 'azure-blue',
        },
      },
    };

    await service.restoreBackup(envelope);

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTables[TRANSACTION_DB_TOKEN].clear).toHaveBeenCalled();
    expect(mockTables[CATEGORY_DB_TOKEN].clear).toHaveBeenCalled();
    expect(mockTables[SUBCATEGORY_DB_TOKEN].clear).toHaveBeenCalled();
    expect(mockTables[BUDGET_DB_TOKEN].clear).toHaveBeenCalled();
    expect(mockTables[CATEGORY_BUDGET_DB_TOKEN].clear).toHaveBeenCalled();

    expect(mockTables[TRANSACTION_DB_TOKEN].bulkAdd).toHaveBeenCalledWith(
      envelope.data.transactions,
    );
    expect(mockTables[CATEGORY_DB_TOKEN].bulkAdd).toHaveBeenCalledWith(envelope.data.categories);
    expect(mockTables[SUBCATEGORY_DB_TOKEN].bulkAdd).toHaveBeenCalledWith(
      envelope.data.subcategories,
    );
    expect(mockTables[BUDGET_DB_TOKEN].bulkAdd).toHaveBeenCalledWith(envelope.data.budgets);
    expect(mockTables[CATEGORY_BUDGET_DB_TOKEN].bulkAdd).toHaveBeenCalledWith(
      envelope.data.categoryBudgets,
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(BACKUP_CURRENCY_STORAGE_KEY, 'PLN');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(BACKUP_THEME_STORAGE_KEY, 'azure-blue');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  describe('validateBackupFile - Etap 1: Struktura pliku', () => {
    it('should reject null or non-object file', () => {
      const res = service.validateBackupFile(null);
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_FILE');
        expect(res.message).toBe('Twój plik jest nieprawidłowy');
      }
    });

    it('should reject file with missing or wrong schemaVersion', () => {
      const res = service.validateBackupFile({ schemaVersion: 99, data: {} });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_FILE');
        expect(res.message).toBe('Twój plik jest nieprawidłowy');
      }
    });

    it('should reject file without data object', () => {
      const res = service.validateBackupFile({ schemaVersion: 1 });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_FILE');
        expect(res.message).toBe('Twój plik jest nieprawidłowy');
      }
    });
  });

  // covers: docs/specs/settings/data-export-import.md#AC-7
  describe('validateBackupFile - Etap 2: Walidacja danych wewnątrz kolekcji', () => {
    it('should reject transaction with missing or empty id', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        data: {
          transactions: [{ id: '', amount: 100, date: '2026-11-10', categoryId: 'cat-1' }],
        },
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_DATA');
        expect(res.message).toBe('Błędne dane w pliku');
        expect(res.details).toContain("Brakujące lub nieprawidłowe pole 'id' w transakcji #1");
      }
    });

    it('should reject transaction with NaN or non-number amount', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        data: {
          transactions: [
            {
              id: 'tx-1',
              amount: 'not-a-number' as unknown as number,
              date: '2026-11-10',
              categoryId: 'cat-1',
            },
          ],
        },
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_DATA');
        expect(res.message).toBe('Błędne dane w pliku');
        expect(res.details).toContain('Brakująca lub nieprawidłowa kwota w transakcji #1');
      }
    });

    it('should reject category with missing name', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        data: {
          transactions: [],
          categories: [{ id: 'c-1', name: '   ' }],
        },
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_DATA');
        expect(res.message).toBe('Błędne dane w pliku');
        expect(res.details).toContain('Brakująca lub nieprawidłowa nazwa w kategorii #1');
      }
    });

    it('should reject subcategory with missing categoryId', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        data: {
          subcategories: [{ id: 's-1', categoryId: '', name: 'Sub 1' }],
        },
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_DATA');
        expect(res.message).toBe('Błędne dane w pliku');
        expect(res.details).toContain("Brakujące pole 'categoryId' w podkategorii #1");
      }
    });

    it('should reject budget with negative amount', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        data: {
          budgets: [{ id: 1, amount: -50, updatedAt: '2026-11-10' }],
        },
      });
      expect(res.isValid).toBe(false);
      if (!res.isValid) {
        expect(res.errorType).toBe('INVALID_DATA');
        expect(res.message).toBe('Błędne dane w pliku');
        expect(res.details).toContain('Nieprawidłowa kwota w budżecie #1');
      }
    });

    it('should successfully validate valid envelope and sanitize settings', () => {
      const res = service.validateBackupFile({
        schemaVersion: 1,
        exportedAt: '2026-11-11T12:00:00Z',
        data: {
          transactions: [{ id: 'tx-1', amount: 50, date: '2026-11-10', categoryId: 'cat-1' }],
          categories: [{ id: 'cat-1', name: 'Jedzenie' }],
          subcategories: [],
          budgets: [{ id: 1, amount: 2000, updatedAt: '2026-11-10' }],
          categoryBudgets: [],
          settings: {
            currency: 'PLN',
            theme: null,
          },
        },
      });

      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.data.schemaVersion).toBe(1);
        expect(res.data.data.transactions).toHaveLength(1);
        expect(res.data.data.settings.currency).toBe('PLN');
      }
    });
  });

  it('should trigger browser download for backup envelope', () => {
    const envelope: BackupFileEnvelope = {
      schemaVersion: 1,
      exportedAt: '2026-11-11T10:00:00Z',
      data: {
        transactions: [],
        categories: [],
        subcategories: [],
        budgets: [],
        categoryBudgets: [],
        settings: { currency: null, theme: null },
      },
    };

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const mockDocument = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test'),
      revokeObjectURL: vi.fn(),
    });

    service.downloadBackupFile(envelope, 'test-backup.json');

    expect(mockDocument.createElement).toHaveBeenCalledWith('a');
    expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockDocument.body.removeChild).toHaveBeenCalledWith(mockAnchor);

    vi.unstubAllGlobals();
  });
});
