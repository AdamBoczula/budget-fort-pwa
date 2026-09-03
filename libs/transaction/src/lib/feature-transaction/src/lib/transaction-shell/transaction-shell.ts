import { DOCUMENT } from '@angular/common';
import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LocalStorageService } from 'local-db';
import { RouterModule } from '@angular/router';
import {
  TransactionThemeId,
  TransactionThemeOption,
  TransactionNavigationDrawerComponent,
} from '@ui-transaction';
import { TransactionTopBarComponent } from '../header/header';
import { TransactionState } from '../service/transaction-state/transaction-state';
import { DashboardState } from '../service/dashboard-state/dashboard-state';

const THEME_STORAGE_KEY = 'budget-fort.theme';
const DEFAULT_THEME_ID: TransactionThemeId = 'azure-blue';
const THEME_ROOT_CLASS_PREFIX = 'theme-';

const TRANSACTION_THEME_OPTIONS: ReadonlyArray<TransactionThemeOption> = [
  { id: 'azure-blue', label: 'Azure & Blue' },
  { id: 'rose-red', label: 'Rose & Red' },
  { id: 'magenta-violet', label: 'Magenta & Violet' },
  { id: 'cyan-orange', label: 'Cyan & Orange' },
];

@Component({
  selector: 'transaction-shell',
  imports: [
    RouterModule,
    MatSidenavModule,
    TransactionTopBarComponent,
    TransactionNavigationDrawerComponent,
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav
        mode="over"
        [opened]="isSidebarOpen()"
        (openedChange)="onSidebarStateChange($event)"
      >
        <transaction-navigation-drawer
          [activeTheme]="activeTheme()"
          [themeOptions]="themeOptions"
          (themeChange)="onThemeChange($event)"
          (drawerClose)="closeSidebar()"
        />
      </mat-sidenav>

      <mat-sidenav-content>
        <header>
          <transaction-header
            [monthName]="dashboardState.periodLabel()"
            [balance]="dashboardState.totalSpending()"
            (menuClick)="toggleSidebar()"
          />
        </header>

        <main class="transaction-shell__content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './transaction-shell.scss',
})
export class TransactionShellComponent {
  protected readonly transactionState = inject(TransactionState);
  protected readonly dashboardState = inject(DashboardState);
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID);
  private readonly localStorageService = inject(LocalStorageService);

  protected readonly isSidebarOpen = signal(false);
  protected readonly activeTheme = signal<TransactionThemeId>(DEFAULT_THEME_ID);
  protected readonly themeOptions = TRANSACTION_THEME_OPTIONS;

  public constructor() {
    const savedTheme = this.localStorageService.getItem(THEME_STORAGE_KEY);
    const initialTheme = this.resolveThemeId(savedTheme);

    this.activeTheme.set(initialTheme);
    this.applyThemeClass(initialTheme);
  }

  protected toggleSidebar(): void {
    this.isSidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  protected onThemeChange(themeId: TransactionThemeId): void {
    this.activeTheme.set(themeId);
    this.localStorageService.setItem(THEME_STORAGE_KEY, themeId);
    this.applyThemeClass(themeId);
    this.closeSidebar();
  }

  protected onSidebarStateChange(isOpen: boolean): void {
    this.isSidebarOpen.set(isOpen);
  }

  private resolveThemeId(candidate: string | null): TransactionThemeId {
    if (
      candidate &&
      this.themeOptions.some((theme) => theme.id === candidate)
    ) {
      return candidate as TransactionThemeId;
    }

    return DEFAULT_THEME_ID;
  }

  private applyThemeClass(themeId: TransactionThemeId): void {
    const documentClassList = this.document.documentElement.classList;

    for (const theme of this.themeOptions) {
      documentClassList.remove(`${THEME_ROOT_CLASS_PREFIX}${theme.id}`);
    }

    documentClassList.add(`${THEME_ROOT_CLASS_PREFIX}${themeId}`);
  }
}
