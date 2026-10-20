import { Component, inject, input, LOCALE_ID, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';

export type TransactionThemeId = 'azure-blue' | 'rose-red' | 'magenta-violet' | 'cyan-orange';

export type TransactionThemeOption = {
  id: TransactionThemeId;
  label: string;
};

type NavigationItem = {
  label: string;
  route: string;
};

@Component({
  selector: 'transaction-navigation-drawer',
  imports: [
    RouterModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="header">
      <h2 i18n="@@navigation.title">Nawigacja</h2>
      <button
        type="button"
        matIconButton
        i18n-aria-label="@@navigation.closeAria"
        aria-label="Zamknij nawigacje"
        (click)="requestClose()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-nav-list>
      @for (item of navigationItems; track item.route) {
        <a mat-list-item [routerLink]="item.route" (click)="requestClose()">
          {{ item.label }}
        </a>
      }
    </mat-nav-list>

    <div class="theme-switcher">
      <mat-form-field appearance="outline" class="theme-field">
        <mat-label i18n="@@navigation.themeLabel">Motyw</mat-label>
        <mat-select [value]="activeTheme()" (selectionChange)="selectTheme($event.value)">
          @for (theme of themeOptions(); track theme.id) {
            <mat-option [value]="theme.id">{{ theme.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styleUrl: './transaction-navigation-drawer.component.scss',
})
export class TransactionNavigationDrawerComponent {
  private readonly localeId = inject(LOCALE_ID);

  protected readonly navigationItems: ReadonlyArray<NavigationItem> = this.createNavigationItems();

  public readonly drawerClose = output<void>();
  public readonly themeChange = output<TransactionThemeId>();
  public readonly activeTheme = input.required<TransactionThemeId>();
  public readonly themeOptions = input.required<ReadonlyArray<TransactionThemeOption>>();

  protected requestClose(): void {
    this.drawerClose.emit();
  }

  protected selectTheme(themeId: TransactionThemeId): void {
    if (themeId === this.activeTheme()) {
      return;
    }

    this.themeChange.emit(themeId);
  }

  private createNavigationItems(): ReadonlyArray<NavigationItem> {
    if (this.localeId.startsWith('en')) {
      return [
        { label: 'Dashboard', route: '/feature-transaction/dashboard' },
        { label: 'Transactions', route: '/feature-transaction' },
        { label: 'Budget', route: '/feature-transaction/settings/budget' },
        { label: 'Settings', route: '/feature-transaction/settings' },
      ];
    }

    return [
      { label: 'Panel główny', route: '/feature-transaction/dashboard' },
      { label: 'Transakcje', route: '/feature-transaction' },
      { label: 'Budżet', route: '/feature-transaction/settings/budget' },
      { label: 'Ustawienia', route: '/feature-transaction/settings' },
    ];
  }
}
