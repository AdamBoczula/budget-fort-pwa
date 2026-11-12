// spec: docs/specs/settings/data-export-import.md

import { BackupData, BackupFileEnvelope, BackupValidationResult } from './backup-restore.types';

/**
 * Pure TypeScript validator for backup JSON files.
 * Validates envelope schema integrity (Step 1) and entity records (Step 2).
 * Does not depend on Angular dependency injection or lifecycle.
 */
export class BackupRestoreValidator {
  public static validate(raw: unknown): BackupValidationResult {
    // Etap 1: Sprawdzenie struktury pliku
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        isValid: false,
        errorType: 'INVALID_FILE',
        message: 'Twój plik jest nieprawidłowy',
        details: 'Plik nie jest poprawnym obiektem JSON.',
      };
    }

    const envelope = raw as Partial<BackupFileEnvelope>;

    if (envelope.schemaVersion !== 1) {
      return {
        isValid: false,
        errorType: 'INVALID_FILE',
        message: 'Twój plik jest nieprawidłowy',
        details: 'Nieobsługiwana wersja schematu lub brak pola schemaVersion.',
      };
    }

    if (!envelope.data || typeof envelope.data !== 'object' || Array.isArray(envelope.data)) {
      return {
        isValid: false,
        errorType: 'INVALID_FILE',
        message: 'Twój plik jest nieprawidłowy',
        details: 'Brak sekcji data w pliku kopii zapasowej.',
      };
    }

    const data = envelope.data as Partial<BackupData>;

    if (
      (data.transactions && !Array.isArray(data.transactions)) ||
      (data.categories && !Array.isArray(data.categories)) ||
      (data.subcategories && !Array.isArray(data.subcategories)) ||
      (data.budgets && !Array.isArray(data.budgets)) ||
      (data.categoryBudgets && !Array.isArray(data.categoryBudgets))
    ) {
      return {
        isValid: false,
        errorType: 'INVALID_FILE',
        message: 'Twój plik jest nieprawidłowy',
        details: 'Sekcje danych nie są prawidłowymi tablicami.',
      };
    }

    // Etap 2: Walidacja danych wewnątrz kolekcji
    const transactions = data.transactions ?? [];
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (!tx || typeof tx !== 'object') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Transakcja #${i + 1} nie jest prawidłowym obiektem.`,
        };
      }
      if (typeof tx.id !== 'string' || !tx.id.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące lub nieprawidłowe pole 'id' w transakcji #${i + 1}.`,
        };
      }
      if (typeof tx.amount !== 'number' || Number.isNaN(tx.amount)) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakująca lub nieprawidłowa kwota w transakcji #${i + 1}.`,
        };
      }
      if (typeof tx.date !== 'string' || !tx.date.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakująca lub nieprawidłowa data w transakcji #${i + 1}.`,
        };
      }
      if (typeof tx.categoryId !== 'string') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące lub nieprawidłowe pole 'categoryId' w transakcji #${i + 1}.`,
        };
      }
    }

    const categories = data.categories ?? [];
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      if (!cat || typeof cat !== 'object') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Kategoria #${i + 1} nie jest prawidłowym obiektem.`,
        };
      }
      if (typeof cat.id !== 'string' || !cat.id.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące lub nieprawidłowe pole 'id' w kategorii #${i + 1}.`,
        };
      }
      if (typeof cat.name !== 'string' || !cat.name.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakująca lub nieprawidłowa nazwa w kategorii #${i + 1}.`,
        };
      }
    }

    const subcategories = data.subcategories ?? [];
    for (let i = 0; i < subcategories.length; i++) {
      const sub = subcategories[i];
      if (!sub || typeof sub !== 'object') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Podkategoria #${i + 1} nie jest prawidłowym obiektem.`,
        };
      }
      if (typeof sub.id !== 'string' || !sub.id.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące lub nieprawidłowe pole 'id' w podkategorii #${i + 1}.`,
        };
      }
      if (typeof sub.categoryId !== 'string' || !sub.categoryId.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące pole 'categoryId' w podkategorii #${i + 1}.`,
        };
      }
      if (typeof sub.name !== 'string' || !sub.name.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakująca nazwa w podkategorii #${i + 1}.`,
        };
      }
    }

    const budgets = data.budgets ?? [];
    for (let i = 0; i < budgets.length; i++) {
      const b = budgets[i];
      if (!b || typeof b !== 'object') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Budżet #${i + 1} nie jest prawidłowym obiektem.`,
        };
      }
      if (typeof b.amount !== 'number' || Number.isNaN(b.amount) || b.amount < 0) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Nieprawidłowa kwota w budżecie #${i + 1}.`,
        };
      }
    }

    const categoryBudgets = data.categoryBudgets ?? [];
    for (let i = 0; i < categoryBudgets.length; i++) {
      const cb = categoryBudgets[i];
      if (!cb || typeof cb !== 'object') {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Budżet kategorii #${i + 1} nie jest prawidłowym obiektem.`,
        };
      }
      if (typeof cb.categoryId !== 'string' || !cb.categoryId.trim()) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Brakujące pole 'categoryId' w budżecie kategorii #${i + 1}.`,
        };
      }
      if (typeof cb.amount !== 'number' || Number.isNaN(cb.amount) || cb.amount < 0) {
        return {
          isValid: false,
          errorType: 'INVALID_DATA',
          message: 'Błędne dane w pliku',
          details: `Nieprawidłowa kwota w budżecie kategorii #${i + 1}.`,
        };
      }
    }

    const validated: BackupFileEnvelope = {
      schemaVersion: 1,
      appVersion: envelope.appVersion,
      exportedAt: envelope.exportedAt || new Date().toISOString(),
      data: {
        transactions,
        categories,
        subcategories,
        budgets,
        categoryBudgets,
        settings: {
          currency: data.settings?.currency ?? null,
          theme: data.settings?.theme ?? null,
        },
      },
    };

    return {
      isValid: true,
      data: validated,
    };
  }
}
