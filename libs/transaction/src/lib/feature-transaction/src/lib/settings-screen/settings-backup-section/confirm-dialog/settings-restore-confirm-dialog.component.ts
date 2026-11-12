// spec: docs/specs/settings/data-export-import.md

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BackupFileEnvelope } from 'local-db';
import { AuthState } from '@data-access-auth';
import { AppLanguageService } from '@currency';

export interface SettingsRestoreConfirmDialogData {
  envelope: BackupFileEnvelope;
}

@Component({
  selector: 'transaction-settings-restore-confirm-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="restore-dialog">
      <div class="restore-dialog__header">
        <mat-icon>warning</mat-icon>
        <h2 class="restore-dialog__title" i18n="@@settings.restoreDialogTitle">
          Przywracanie kopii zapasowej
        </h2>
      </div>

      <div class="restore-dialog__warning-box">
        <mat-icon>error_outline</mat-icon>
        <span i18n="@@settings.restoreWarningText">
          Uwaga! Wszystkie obecne transakcje, kategorie i budżety zostaną bezpowrotnie usunięte i
          zastąpione zawartością pliku.
        </span>
      </div>

      <div class="restore-dialog__summary">
        <div class="restore-dialog__summary-title" i18n="@@settings.restoreSummaryTitle">
          Zawartość pliku do zaimportowania:
        </div>
        <div class="restore-dialog__summary-item">
          <span i18n="@@settings.restoreTransactionsCount">Transakcje:</span>
          <strong>{{ transactionsCount() }}</strong>
        </div>
        <div class="restore-dialog__summary-item">
          <span i18n="@@settings.restoreCategoriesCount">Kategorie i podkategorie:</span>
          <strong>{{ categoriesCount() }} ({{ subcategoriesCount() }})</strong>
        </div>
        <div class="restore-dialog__summary-item">
          <span i18n="@@settings.restoreBudgetsCount">Budżety i limity:</span>
          <strong>{{ budgetsCount() }}</strong>
        </div>
      </div>

      <p class="restore-dialog__instruction" i18n="@@settings.restoreInstruction">
        Aby potwierdzić operację, wpisz poniżej: <code>{{ displayExpectedPhrase() }}</code>
      </p>

      <mat-form-field appearance="outline" class="restore-dialog__form-field">
        <mat-label i18n="@@settings.restoreInputLabel">Wpisz frazę potwierdzającą</mat-label>
        <input
          matInput
          [ngModel]="confirmationInput()"
          (ngModelChange)="onInputChange($event)"
          [placeholder]="displayExpectedPhrase()"
          data-testid="restore-confirm-input"
          autocomplete="off"
        />
      </mat-form-field>

      <div class="restore-dialog__actions">
        <button mat-button (click)="cancel()" i18n="@@settings.restoreCancelBtn">Anuluj</button>
        <button
          mat-flat-button
          color="warn"
          class="restore-dialog__confirm-btn"
          data-testid="restore-confirm-submit-btn"
          [disabled]="!isMatch()"
          (click)="confirm()"
          i18n="@@settings.restoreSubmitBtn"
        >
          Potwierdź i przywróć
        </button>
      </div>
    </div>
  `,
  styleUrl: './settings-restore-confirm-dialog.component.scss',
})
export class SettingsRestoreConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SettingsRestoreConfirmDialogComponent>);
  public readonly data = inject<SettingsRestoreConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly authState = inject(AuthState);
  private readonly appLanguage = inject(AppLanguageService);

  public readonly confirmationInput = signal('');

  public readonly isPolish = this.appLanguage.isPolish;

  public readonly displayExpectedPhrase = computed(() => {
    const user = this.authState.currentUser();
    if (user?.email) {
      return user.email;
    }
    return this.isPolish() ? 'użytkownik gość' : 'guest user';
  });

  public readonly isMatch = computed(() => {
    const input = this.confirmationInput().trim().toLowerCase();
    const user = this.authState.currentUser();

    if (user?.email) {
      return input === user.email.trim().toLowerCase();
    }

    // Dla gościa akceptujemy zarówno wersję polską jak i angielską
    return input === 'użytkownik gość' || input === 'guest user';
  });

  public readonly transactionsCount = computed(
    () => this.data?.envelope?.data?.transactions?.length ?? 0,
  );
  public readonly categoriesCount = computed(
    () => this.data?.envelope?.data?.categories?.length ?? 0,
  );
  public readonly subcategoriesCount = computed(
    () => this.data?.envelope?.data?.subcategories?.length ?? 0,
  );
  public readonly budgetsCount = computed(
    () =>
      (this.data?.envelope?.data?.budgets?.length ?? 0) +
      (this.data?.envelope?.data?.categoryBudgets?.length ?? 0),
  );

  public onInputChange(val: string): void {
    this.confirmationInput.set(val);
  }

  public cancel(): void {
    this.dialogRef.close(false);
  }

  public confirm(): void {
    if (this.isMatch()) {
      this.dialogRef.close(true);
    }
  }
}
