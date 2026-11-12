// spec: docs/specs/settings/data-export-import.md
/// <reference types="@angular/localize/init" />

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BackupRestoreService } from 'local-db';
import {
  SettingsRestoreConfirmDialogComponent,
  SettingsRestoreConfirmDialogData,
} from './confirm-dialog/settings-restore-confirm-dialog.component';

@Component({
  selector: 'transaction-settings-backup-section',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="settings-section">
      <h2 i18n="@@settings.backupSectionTitle">Kopia zapasowa i dane</h2>
      <p class="settings-section__description" i18n="@@settings.backupSectionDescription">
        Eksportuj swoje dane do pliku JSON, aby przenieść je na inne urządzenie lub przeglądarkę,
        albo przywróć dane z wcześniej utworzonej kopii zapasowej.
      </p>

      <div class="settings-section__actions">
        <button
          mat-stroked-button
          class="settings-section__btn"
          data-testid="export-backup-btn"
          (click)="exportData()"
        >
          <mat-icon>download</mat-icon>
          <span i18n="@@settings.exportDataBtn">Eksportuj dane</span>
        </button>

        <button
          mat-stroked-button
          class="settings-section__btn"
          data-testid="import-backup-btn"
          (click)="fileInput.click()"
        >
          <mat-icon>upload</mat-icon>
          <span i18n="@@settings.importDataBtn">Importuj dane</span>
        </button>

        <input
          #fileInput
          type="file"
          accept=".json"
          class="settings-section__file-input"
          data-testid="backup-file-input"
          (change)="onFileSelected($event)"
        />
      </div>
    </div>
  `,
  styleUrl: './settings-backup-section.component.scss',
})
export class SettingsBackupSectionComponent {
  private readonly backupService = inject(BackupRestoreService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  public async exportData(): Promise<void> {
    try {
      const backup = await this.backupService.exportBackup();
      this.backupService.downloadBackupFile(backup);
      this.snackBar.open(
        $localize`:@@settings.exportSuccess:Kopia zapasowa została wyeksportowana`,
        undefined,
        {
          duration: 3000,
        },
      );
    } catch {
      this.snackBar.open(
        $localize`:@@settings.exportError:Wystąpił błąd podczas eksportowania danych`,
        undefined,
        { duration: 4000 },
      );
    }
  }

  public async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    // Reset input so selecting the same file again triggers change event
    input.value = '';

    let content = '';
    try {
      content = await this.readFileContent(file);
    } catch {
      this.snackBar.open(
        $localize`:@@settings.invalidFile:Twój plik jest nieprawidłowy`,
        undefined,
        {
          duration: 4000,
        },
      );
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      this.snackBar.open(
        $localize`:@@settings.invalidFile:Twój plik jest nieprawidłowy`,
        undefined,
        {
          duration: 4000,
        },
      );
      return;
    }

    const validationResult = this.backupService.validateBackupFile(parsed);
    if (!validationResult.isValid) {
      if (validationResult.errorType === 'INVALID_FILE') {
        this.snackBar.open(
          $localize`:@@settings.invalidFile:Twój plik jest nieprawidłowy`,
          undefined,
          {
            duration: 4000,
          },
        );
      } else {
        const errorMsg = $localize`:@@settings.invalidData:Błędne dane w pliku: ${validationResult.details}:details:`;
        this.snackBar.open(errorMsg, undefined, { duration: 6000 });
      }
      return;
    }

    const dialogRef = this.dialog.open<
      SettingsRestoreConfirmDialogComponent,
      SettingsRestoreConfirmDialogData,
      boolean
    >(SettingsRestoreConfirmDialogComponent, {
      data: {
        envelope: validationResult.data,
      },
      width: '480px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.backupService.restoreBackup(validationResult.data);
          this.snackBar.open(
            $localize`:@@settings.restoreSuccess:Dane zostały pomyślnie przywrócone`,
            undefined,
            { duration: 3000 },
          );
          setTimeout(() => {
            this.reloadPage();
          }, 600);
        } catch {
          this.snackBar.open(
            $localize`:@@settings.restoreError:Wystąpił błąd podczas przywracania danych`,
            undefined,
            { duration: 5000 },
          );
        }
      }
    });
  }

  public async readFileContent(file: File): Promise<string> {
    if (typeof file.text === 'function') {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  public reloadPage(): void {
    if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
      window.location.reload();
    }
  }
}
