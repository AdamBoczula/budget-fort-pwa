import { Component, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TransactionThemeId, TransactionThemeOption } from '@ui-transaction';
import { LocalStorageService } from 'local-db';
import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
} from '../settings-constants';
import { applyThemeClass } from '../theme-utils';

const SETTINGS_THEME_OPTIONS: ReadonlyArray<TransactionThemeOption> = [
  { id: 'azure-blue', label: 'Azure & Blue' },
  { id: 'rose-red', label: 'Rose & Red' },
  { id: 'magenta-violet', label: 'Magenta & Violet' },
  { id: 'cyan-orange', label: 'Cyan & Orange' },
];

@Component({
  selector: 'transaction-settings-theme-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './settings-theme-selector.html',
  styleUrl: './settings-theme-selector.scss',
})
export class SettingsThemeSelectorComponent {
  private readonly localStorageService = inject(LocalStorageService);

  protected readonly activeTheme = signal<TransactionThemeId>(DEFAULT_THEME_ID);
  protected readonly themeOptions = SETTINGS_THEME_OPTIONS;

  public constructor() {
    this.loadTheme();
  }

  protected onThemeChange(themeId: TransactionThemeId): void {
    this.activeTheme.set(themeId);
    this.localStorageService.setItem(THEME_STORAGE_KEY, themeId);
    applyThemeClass(themeId);
  }

  private loadTheme(): void {
    const saved = this.localStorageService.getItem(THEME_STORAGE_KEY);
    if (saved && this.themeOptions.some((t) => t.id === saved)) {
      this.activeTheme.set(saved as TransactionThemeId);
    }
  }
}