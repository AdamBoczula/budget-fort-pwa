import { Component, computed, inject } from '@angular/core';
import { CategoriesQuickAddComponent } from '../categories-quick-add/categories-quick-add';
import { HomeScreenOfflineIndicatorComponent } from './home-screen-offline-indicator/home-screen-offline-indicator';
import { HomeScreenIncomeFabComponent } from './home-screen-income-fab/home-screen-income-fab';
import { HomeScreenSkeletonComponent } from './home-screen-skeleton/home-screen-skeleton';
import { LastTransactionComponent } from '../last-transaction/last-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

@Component({
  selector: 'transaction-home-page-screen',
  imports: [
    CategoriesQuickAddComponent,
    HomeScreenOfflineIndicatorComponent,
    HomeScreenIncomeFabComponent,
    HomeScreenSkeletonComponent,
    LastTransactionComponent,
  ],
  templateUrl: './home-screen.html',
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