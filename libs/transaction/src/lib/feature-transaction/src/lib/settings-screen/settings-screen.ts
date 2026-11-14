// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
// spec: docs/specs/transaction/recurring-transactions.md
// spec: docs/specs/sync/02-multi-user-household.md

import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsCategoriesSectionComponent } from './settings-categories-section/settings-categories-section';
import { SettingsRecurringSectionComponent } from './settings-recurring-section/settings-recurring-section';
import { SettingsHouseholdSectionComponent } from './settings-household-section/settings-household-section';
import { SettingsThemeSelectorComponent } from './settings-theme-selector/settings-theme-selector';
import { SettingsCurrencySelectorComponent } from './settings-currency-selector/settings-currency-selector';
import { SettingsBackupSectionComponent } from './settings-backup-section/settings-backup-section.component';

@Component({
  selector: 'transaction-settings-screen',
  imports: [
    MatDividerModule,
    SettingsCategoriesSectionComponent,
    SettingsRecurringSectionComponent,
    SettingsHouseholdSectionComponent,
    SettingsThemeSelectorComponent,
    SettingsCurrencySelectorComponent,
    SettingsBackupSectionComponent,
  ],
  template: `
    <div class="settings-page">
      <transaction-settings-household-section />
      <mat-divider />
      <transaction-settings-categories-section />
      <mat-divider />
      <transaction-settings-recurring-section />
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
