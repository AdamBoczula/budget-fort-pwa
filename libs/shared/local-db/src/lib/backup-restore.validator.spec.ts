// spec: docs/specs/settings/data-export-import.md

import { describe, expect, it } from 'vitest';
import { BackupRestoreValidator } from './backup-restore.validator';

describe('BackupRestoreValidator', () => {
  // covers: docs/specs/settings/data-export-import.md#AC-5
  it('should reject non-object payloads with INVALID_FILE', () => {
    const res = BackupRestoreValidator.validate(null);
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_FILE');
    expect(res.message).toBe('Twój plik jest nieprawidłowy');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-5
  it('should reject payload with missing schemaVersion or unsupported version', () => {
    const res = BackupRestoreValidator.validate({
      schemaVersion: 2,
      data: {},
    });
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_FILE');
    expect(res.message).toBe('Twój plik jest nieprawidłowy');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-5
  it('should reject payload when data section is missing or not an object', () => {
    const res = BackupRestoreValidator.validate({
      schemaVersion: 1,
      data: 'invalid',
    });
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_FILE');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  it('should reject malformed transaction records with INVALID_DATA', () => {
    const res = BackupRestoreValidator.validate({
      schemaVersion: 1,
      data: {
        transactions: [{ id: '1', amount: 'not-a-number', date: '2026-01-01', categoryId: 'c1' }],
      },
    });
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_DATA');
    expect(res.message).toBe('Błędne dane w pliku');
    expect(res.details).toContain('kwota');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  it('should reject category without name', () => {
    const res = BackupRestoreValidator.validate({
      schemaVersion: 1,
      data: {
        categories: [{ id: 'c1', name: '' }],
      },
    });
    expect(res.isValid).toBe(false);
    expect(res.errorType).toBe('INVALID_DATA');
    expect(res.details).toContain('nazwa');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  it('should accept valid envelope and data', () => {
    const res = BackupRestoreValidator.validate({
      schemaVersion: 1,
      data: {
        transactions: [{ id: 't1', amount: 15.5, date: '2026-03-01', categoryId: 'c1' }],
        categories: [{ id: 'c1', name: 'Jedzenie' }],
        subcategories: [],
        budgets: [],
        categoryBudgets: [],
        settings: { currency: 'EUR', theme: 'dark' },
      },
    });
    expect(res.isValid).toBe(true);
    expect(res.data?.data.transactions.length).toBe(1);
    expect(res.data?.data.settings.currency).toBe('EUR');
  });
});
