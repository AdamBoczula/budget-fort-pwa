import { Component, computed, inject, OnInit } from '@angular/core';
import { CategoriesQuickAddComponent } from '../categories-quick-add/categories-quick-add';
import { LastTransactionComponent } from '../last-transaction/last-transaction';
import { TransactionState } from '../service/transaction-state/transaction-state';

@Component({
  selector: 'transaction-home-page-screen',
  imports: [CategoriesQuickAddComponent, LastTransactionComponent],
  template: `
    @if (isInitialLoading()) {
      <section
        class="home-screen-skeleton"
        i18n-aria-label="@@home.loadingAria"
        aria-label="Ladowanie transakcji"
      >
        <div class="home-screen-skeleton__title shimmer"></div>
        <div class="home-screen-skeleton__cards">
          <div class="home-screen-skeleton__card shimmer"></div>
          <div class="home-screen-skeleton__card shimmer"></div>
          <div class="home-screen-skeleton__card shimmer"></div>
          <div class="home-screen-skeleton__card shimmer"></div>
        </div>
        <div class="home-screen-skeleton__list-item shimmer"></div>
        <div class="home-screen-skeleton__list-item shimmer"></div>
        <div class="home-screen-skeleton__list-item shimmer"></div>
      </section>
    } @else {
      <transaction-categories-quick-add />
      <transaction-last-transaction />
    }

    @if (transactionState.error()) {
      <p class="home-screen-info" i18n="@@home.offlineInfo">
        Tryb offline. Pokazywane sa tylko dane lokalne.
      </p>
    }
  `,
  styleUrl: './home-screen.scss',
})
export class HomePageScreen implements OnInit {
  protected readonly transactionState = inject(TransactionState);

  protected readonly isInitialLoading = computed(
    () =>
      this.transactionState.loading() && !this.transactionState.initialized(),
  );

  public ngOnInit(): void {
    if (
      !this.transactionState.initialized() &&
      !this.transactionState.loading()
    ) {
      void this.transactionState.loadTransactions();
    }
  }
}
