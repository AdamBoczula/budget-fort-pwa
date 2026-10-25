// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { Component, inject, LOCALE_ID, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
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
  route: string;
};

@Component({
  selector: 'transaction-navigation-drawer',
  imports: [
    RouterModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
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
            }
          </mat-nav-list>
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styleUrl: './transaction-navigation-drawer.component.scss',
})
export class TransactionNavigationDrawerComponent {
  private readonly localeId = inject(LOCALE_ID);

  protected readonly menuGroups: ReadonlyArray<MenuGroup> = this.createMenuGroups();

  public readonly drawerClose = output<void>();

  protected requestClose(): void {
    this.drawerClose.emit();
  }

  private createMenuGroups(): ReadonlyArray<MenuGroup> {
    const isEn = this.localeId.startsWith('en');

    return [
      {
        label: isEn ? 'Transactions' : 'Transakcje',
        icon: 'receipt',
        items: [
          {
            label: isEn ? 'Home' : 'Strona główna',
            icon: 'home',
            route: '/home',
          },
          {
            label: isEn ? 'Dashboard' : 'Dashboard',
            icon: 'dashboard',
            route: '/dashboard',
          },
        ],
      },
      {
        label: isEn ? 'Budget' : 'Budżet',
        icon: 'savings',
        items: [
          {
            label: isEn ? 'Budget planning' : 'Planowanie budżetu',
            icon: 'account_balance_wallet',
            route: '/budget',
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
            route: '/settings',
          },
        ],
      },
    ];
  }
}