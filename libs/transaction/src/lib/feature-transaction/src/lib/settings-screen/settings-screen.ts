// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsCategoriesSectionComponent } from './settings-categories-section/settings-categories-section';
import { SettingsThemeSelectorComponent } from './settings-theme-selector/settings-theme-selector';
import { SettingsCurrencySelectorComponent } from './settings-currency-selector/settings-currency-selector';
import { SettingsBackupSectionComponent } from './settings-backup-section/settings-backup-section.component';

@Component({
  selector: 'transaction-settings-screen',
  imports: [
    MatDividerModule,
    SettingsCategoriesSectionComponent,
    SettingsThemeSelectorComponent,
    SettingsCurrencySelectorComponent,
    SettingsBackupSectionComponent,
  ],
  template: `
    <div class="settings-page">
      <transaction-settings-categories-section />
      <mat-divider />
      <transaction-settings-theme-selector />
      <mat-divider />
      <transaction-settings-currency-selector />
      <mat-divider />
      <transaction-settings-backup-section />
    </div>
  `,
  styleUrl: './settings-screen.scss',
})
export class SettingsPageScreen {}
