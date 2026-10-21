// spec: docs/specs/budget/przeglad-historii-budzetu.md

import { Component, inject, input, LOCALE_ID, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
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

type MenuGroup = {
  label: string;
  icon: string;
  items: MenuItem[];
};

type MenuItem = {
  label: string;
  icon: string;
  route?: string;
  action?: 'addTransaction';
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
    MatExpansionModule,
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

    <mat-accordion displayMode="flat" [multi]="false">
      @for (group of menuGroups; track group.label) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="menu-group-icon">{{ group.icon }}</mat-icon>
              <span>{{ group.label }}</span>
            </mat-panel-title>
          </mat-expansion-panel-header>

          <mat-nav-list class="submenu">
            @for (item of group.items; track item.label) {
              @if (item.route) {
                <a
                  mat-list-item
                  [routerLink]="item.route"
                  routerLinkActive="active-link"
                  #rla="routerLinkActive"
                  [class.active]="rla.isActive"
                  (click)="requestClose()"
                >
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span>{{ item.label }}</span>
                </a>
              } @else if (item.action === 'addTransaction') {
                <button
                  mat-list-item
                  (click)="onAddTransaction()"
                >
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span>{{ item.label }}</span>
                </button>
              }
            }
          </mat-nav-list>
        </mat-expansion-panel>
      }
    </mat-accordion>

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

  protected readonly menuGroups: ReadonlyArray<MenuGroup> = this.createMenuGroups();

  public readonly drawerClose = output<void>();
  public readonly addTransactionRequest = output<void>();
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

  protected onAddTransaction(): void {
    this.addTransactionRequest.emit();
  }

  private createMenuGroups(): ReadonlyArray<MenuGroup> {
    const isEn = this.localeId.startsWith('en');

    return [
      {
        label: isEn ? 'Transactions' : 'Transakcje',
        icon: 'receipt',
        items: [
          {
            label: isEn ? 'Add new' : 'Dodaj nowe',
            icon: 'add',
            action: 'addTransaction',
          },
          {
            label: isEn ? 'Dashboard' : 'Dashboard',
            icon: 'dashboard',
            route: '/feature-transaction/dashboard',
          },
        ],
      },
      {
        label: isEn ? 'Budget' : 'Budżet',
        icon: 'savings',
        items: [
          {
            label: isEn ? 'Add new' : 'Dodaj nowy',
            icon: 'add',
            route: '/feature-transaction/settings/budget',
          },
          {
            label: isEn ? 'Dashboard' : 'Dashboard',
            icon: 'dashboard',
            route: '/feature-transaction/dashboard',
          },
        ],
      },
      {
        label: isEn ? 'Settings' : 'Ustawienia',
        icon: 'settings',
        items: [
          {
            label: isEn ? 'Settings' : 'Ustawienia',
            icon: 'settings',
            route: '/feature-transaction/settings',
          },
        ],
      },
    ];
  }
}