// spec: docs/specs/settings/data-export-import.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { BackupFileEnvelope, BackupRestoreService } from 'local-db';
import { SettingsBackupSectionComponent } from './settings-backup-section.component';

describe('SettingsBackupSectionComponent', () => {
  let fixture: ComponentFixture<SettingsBackupSectionComponent>;
  let component: SettingsBackupSectionComponent;

  const mockBackupService = {
    exportBackup: vi.fn(),
    downloadBackupFile: vi.fn(),
    validateBackupFile: vi.fn(),
    restoreBackup: vi.fn(),
  };

  const mockDialog = {
    open: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const sampleEnvelope: BackupFileEnvelope = {
    schemaVersion: 1,
    exportedAt: '2026-11-11T12:00:00Z',
    data: {
      transactions: [],
      categories: [],
      subcategories: [],
      budgets: [],
      categoryBudgets: [],
      settings: { currency: 'PLN', theme: null },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: BackupRestoreService, useValue: mockBackupService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(SettingsBackupSectionComponent, {
        set: {
          imports: [CommonModule, MatButtonModule, MatIconModule],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsBackupSectionComponent);
    component = fixture.componentInstance;
    vi.spyOn(component, 'reloadPage').mockReturnValue(undefined);
    fixture.detectChanges();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-1
  it('should export data and download backup file when export button is clicked', async () => {
    mockBackupService.exportBackup.mockResolvedValue(sampleEnvelope);

    await component.exportData();

    expect(mockBackupService.exportBackup).toHaveBeenCalled();
    expect(mockBackupService.downloadBackupFile).toHaveBeenCalledWith(sampleEnvelope);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Kopia zapasowa została wyeksportowana'),
      undefined,
      expect.any(Object),
    );
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  it('should show "Twój plik jest nieprawidłowy" when file content is not valid JSON', async () => {
    vi.spyOn(component, 'readFileContent').mockResolvedValue('invalid json content');
    const fakeFile = new File(['invalid json content'], 'backup.json');
    const event = {
      target: {
        files: [fakeFile],
        value: 'backup.json',
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Twój plik jest nieprawidłowy'),
      undefined,
      expect.any(Object),
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-6
  it('should show "Twój plik jest nieprawidłowy" when schema validation returns INVALID_FILE', async () => {
    vi.spyOn(component, 'readFileContent').mockResolvedValue(JSON.stringify({ notASchema: true }));
    mockBackupService.validateBackupFile.mockReturnValue({
      isValid: false,
      errorType: 'INVALID_FILE',
      message: 'Twój plik jest nieprawidłowy',
    });

    const fakeFile = new File(['{}'], 'backup.json');
    const event = {
      target: {
        files: [fakeFile],
        value: 'backup.json',
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(mockBackupService.validateBackupFile).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Twój plik jest nieprawidłowy'),
      undefined,
      expect.any(Object),
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-7
  it('should show "Błędne dane w pliku" with details when validation returns INVALID_DATA', async () => {
    vi.spyOn(component, 'readFileContent').mockResolvedValue(
      JSON.stringify({ schemaVersion: 1, data: {} }),
    );
    mockBackupService.validateBackupFile.mockReturnValue({
      isValid: false,
      errorType: 'INVALID_DATA',
      message: 'Błędne dane w pliku',
      details: "Brakujące pole 'id' w transakcji #1",
    });

    const fakeFile = new File(['{}'], 'backup.json');
    const event = {
      target: {
        files: [fakeFile],
        value: 'backup.json',
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining("Brakujące pole 'id' w transakcji #1"),
      undefined,
      expect.any(Object),
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  // covers: docs/specs/settings/data-export-import.md#AC-5
  it('should open confirmation dialog and restore backup on confirm', async () => {
    vi.spyOn(component, 'readFileContent').mockResolvedValue(JSON.stringify(sampleEnvelope));
    mockBackupService.validateBackupFile.mockReturnValue({
      isValid: true,
      data: sampleEnvelope,
    });
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(true),
    });
    mockBackupService.restoreBackup.mockResolvedValue(undefined);

    const fakeFile = new File(['{}'], 'backup.json');
    const event = {
      target: {
        files: [fakeFile],
        value: 'backup.json',
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockBackupService.restoreBackup).toHaveBeenCalledWith(sampleEnvelope);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Dane zostały pomyślnie przywrócone'),
      undefined,
      expect.any(Object),
    );
  });
});
