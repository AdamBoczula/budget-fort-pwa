// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, LOCALE_ID } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

type BottomNavItem = {
  label: string;
  icon: string;
  route: string;
};

@Component({
  selector: 'transaction-bottom-nav',
  imports: [RouterModule, MatIconModule],
  template: `
    <nav
      class="bottom-nav"
      aria-label="Dolna nawigacja mobilna"
      data-testid="transaction-bottom-nav"
    >
      @for (item of items; track item.route) {
        <a
          class="bottom-nav__item"
          [routerLink]="item.route"
          routerLinkActive="bottom-nav__item--active"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <span class="bottom-nav__pill">
            <mat-icon class="bottom-nav__icon">{{ item.icon }}</mat-icon>
          </span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './transaction-bottom-nav.component.scss',
})
export class TransactionBottomNavComponent {
  private readonly localeId = inject(LOCALE_ID);

  protected readonly items: ReadonlyArray<BottomNavItem> = this.createItems();

  private createItems(): ReadonlyArray<BottomNavItem> {
    const isEn = this.localeId.startsWith('en');

    return [
      {
        label: isEn ? 'Home' : 'Start',
        icon: 'home',
        route: '/home',
      },
      {
        label: isEn ? 'Analytics' : 'Analiza',
        icon: 'donut_large',
        route: '/dashboard',
      },
      {
        label: isEn ? 'Budget' : 'Budżet',
        icon: 'account_balance_wallet',
        route: '/budget',
      },
      {
        label: isEn ? 'Settings' : 'Ustawienia',
        icon: 'tune',
        route: '/settings',
      },
    ];
  }
}
