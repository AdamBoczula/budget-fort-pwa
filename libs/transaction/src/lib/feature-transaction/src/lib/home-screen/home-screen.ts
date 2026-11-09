// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, computed, inject } from '@angular/core';
import { CategoriesQuickAddComponent } from '../categories-quick-add/categories-quick-add';
import { HomeScreenHeroComponent } from './home-screen-hero/home-screen-hero';
import { HomeScreenOfflineIndicatorComponent } from './home-screen-offline-indicator/home-screen-offline-indicator';
import { HomeScreenIncomeFabComponent } from './home-screen-income-fab/home-screen-income-fab';
import { HomeScreenSkeletonComponent } from './home-screen-skeleton/home-screen-skeleton';
import { LastTransactionComponent } from '../last-transaction/last-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

@Component({
  selector: 'transaction-home-page-screen',
  imports: [
    CategoriesQuickAddComponent,
    HomeScreenHeroComponent,
    HomeScreenOfflineIndicatorComponent,
    HomeScreenIncomeFabComponent,
    HomeScreenSkeletonComponent,
    LastTransactionComponent,
  ],
  template: `
    @if (isInitialLoading()) {
      <transaction-home-screen-skeleton />
    } @else {
      <transaction-home-screen-hero />
      <transaction-categories-quick-add />
      <transaction-last-transaction />
    }

    <transaction-home-screen-offline-indicator [error]="transactionState.error()" />
    <transaction-home-screen-income-fab />
  `,
  styleUrl: './home-screen.scss',
})
export class HomePageScreen {
  protected readonly transactionState = inject(TransactionState);

  /**
   * Wskazuje pierwsze ładowanie (skeleton-loader).
   * resource() ładuje automatycznie, więc nie trzeba OnInit.
   */
  protected readonly isInitialLoading = computed(
    () => this.transactionState.loading() && !this.transactionState.initialized(),
  );
}
