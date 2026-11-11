// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { Component, inject, LOCALE_ID, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@data-access-auth';

export type TransactionThemeId = 'azure-blue' | 'rose-red' | 'magenta-violet' | 'cyan-orange';

export type TransactionThemeOption = {
  id: TransactionThemeId;
  label: string;
};

type MenuItem = {
  label: string;
  icon: string;
  route: string;
};

@Component({
  selector: 'transaction-navigation-drawer',
  imports: [RouterModule, MatListModule, MatButtonModule, MatIconModule],
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

    <mat-nav-list class="nav-list">
      @for (item of menuItems; track item.route) {
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

    <div class="drawer-footer">
      <button type="button" mat-button class="logout-btn" (click)="onLogout()">
        <mat-icon>logout</mat-icon>
        <span i18n="@@navigation.logout">Wyloguj</span>
      </button>
    </div>
  `,
  styleUrl: './transaction-navigation-drawer.component.scss',
})
export class TransactionNavigationDrawerComponent {
  private readonly localeId = inject(LOCALE_ID);
  private readonly authService = inject(AuthService, { optional: true });
  private readonly router = inject(Router, { optional: true });

  protected readonly menuItems: ReadonlyArray<MenuItem> = this.createMenuItems();

  public readonly drawerClose = output<void>();

  protected requestClose(): void {
    this.drawerClose.emit();
  }

  protected async onLogout(): Promise<void> {
    this.requestClose();
    if (this.authService) {
      await this.authService.logout();
    }
    this.router?.navigate(['/auth/login']);
  }

  private createMenuItems(): ReadonlyArray<MenuItem> {
    const isEn = this.localeId.startsWith('en');

    return [
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
      {
        label: isEn ? 'Budget' : 'Budżet',
        icon: 'account_balance_wallet',
        route: '/budget',
      },
      {
        label: isEn ? 'Settings' : 'Ustawienia',
        icon: 'settings',
        route: '/settings',
      },
    ];
  }
}
