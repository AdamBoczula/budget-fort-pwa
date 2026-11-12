// spec: docs/specs/settings/data-export-import.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LOCALE_ID, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthState } from '@data-access-auth';
import { BackupFileEnvelope } from 'local-db';
import {
  SettingsRestoreConfirmDialogComponent,
  SettingsRestoreConfirmDialogData,
} from './settings-restore-confirm-dialog.component';

describe('SettingsRestoreConfirmDialogComponent', () => {
  let fixture: ComponentFixture<SettingsRestoreConfirmDialogComponent>;
  let component: SettingsRestoreConfirmDialogComponent;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const sampleEnvelope: BackupFileEnvelope = {
    schemaVersion: 1,
    exportedAt: '2026-11-11T12:00:00Z',
    data: {
      transactions: [
        { id: 'tx-1', amount: 100, date: '2026-11-10', categoryId: 'c-1', accountId: 'a-1' },
      ],
      categories: [{ id: 'c-1', name: 'Dom' }],
      subcategories: [{ id: 's-1', categoryId: 'c-1', name: 'Czynsz' }],
      budgets: [{ id: 1, amount: 4000, updatedAt: '2026-11-10' }],
      categoryBudgets: [{ categoryId: 'c-1', amount: 1000, updatedAt: '2026-11-10' }],
      settings: { currency: 'PLN', theme: 'azure-blue' },
    },
  };

  const mockDialogData: SettingsRestoreConfirmDialogData = {
    envelope: sampleEnvelope,
  };

  const currentUserSignal = signal<{ email: string | null; uid: string } | null>(null);
  const isGuestSignal = signal(true);

  const mockAuthState = {
    currentUser: currentUserSignal,
    isGuest: isGuestSignal,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    currentUserSignal.set(null);
    isGuestSignal.set(true);

    await TestBed.configureTestingModule({
      imports: [SettingsRestoreConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AuthState, useValue: mockAuthState },
        { provide: LOCALE_ID, useValue: 'pl-PL' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsRestoreConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-2
  it('should render dialog with summary and disabled warning submit button initially', () => {
    expect(component.transactionsCount()).toBe(1);
    expect(component.categoriesCount()).toBe(1);
    expect(component.subcategoriesCount()).toBe(1);
    expect(component.budgetsCount()).toBe(2);

    const submitBtn = fixture.nativeElement.querySelector(
      '[data-testid="restore-confirm-submit-btn"]',
    );
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.classList.contains('restore-dialog__confirm-btn')).toBe(true);
  });

  // covers: docs/specs/settings/data-export-import.md#AC-2
  // covers: docs/specs/settings/data-export-import.md#AC-3
  it('should unlock submit button when guest types "użytkownik gość" (case-insensitive and trimmed)', () => {
    const submitBtn = fixture.nativeElement.querySelector(
      '[data-testid="restore-confirm-submit-btn"]',
    );
    expect(submitBtn.disabled).toBe(true);

    component.onInputChange('niewlasciwy tekst');
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(true);

    component.onInputChange('  Użytkownik Gość  ');
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(false);

    submitBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  // covers: docs/specs/settings/data-export-import.md#AC-4
  it('should require logged in user email to unlock submit button', () => {
    currentUserSignal.set({ email: 'user@example.com', uid: 'user-123' });
    isGuestSignal.set(false);
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector(
      '[data-testid="restore-confirm-submit-btn"]',
    );
    expect(component.displayExpectedPhrase()).toBe('user@example.com');
    expect(submitBtn.disabled).toBe(true);

    component.onInputChange('użytkownik gość');
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(true);

    component.onInputChange('  User@Example.com ');
    fixture.detectChanges();
    expect(submitBtn.disabled).toBe(false);

    submitBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false on cancel', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
