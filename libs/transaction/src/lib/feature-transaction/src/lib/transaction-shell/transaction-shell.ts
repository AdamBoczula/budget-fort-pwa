// spec: docs/specs/budget/przeglad-historii-budzetu.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import {
  TransactionBottomNavComponent,
  TransactionNavigationDrawerComponent,
} from '@ui-transaction';
import { TransactionTopBarComponent } from '../header/header';
import { DashboardState } from '../service/dashboard-state/dashboard-state';

@Component({
  selector: 'transaction-shell',
  imports: [
    RouterModule,
    MatSidenavModule,
    TransactionTopBarComponent,
    TransactionNavigationDrawerComponent,
    TransactionBottomNavComponent,
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav
        mode="over"
        [opened]="isSidebarOpen()"
        (openedChange)="onSidebarStateChange($event)"
      >
        <transaction-navigation-drawer (drawerClose)="closeSidebar()" />
      </mat-sidenav>

      <mat-sidenav-content>
        <header>
          <transaction-header
            [monthName]="dashboardState.periodLabel()"
            [balance]="dashboardState.balance()"
            (menuClick)="toggleSidebar()"
          />
        </header>

        <main class="transaction-shell__content">
          <router-outlet />
        </main>

        <transaction-bottom-nav />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './transaction-shell.scss',
})
export class TransactionShellComponent {
  protected readonly dashboardState = inject(DashboardState);

  protected readonly isSidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.isSidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  protected onSidebarStateChange(isOpen: boolean): void {
    this.isSidebarOpen.set(isOpen);
  }
}
