import { Component } from '@angular/core';

@Component({
  selector: 'transaction-home-screen-skeleton',
  template: `
    <section
      class="transaction-home-screen-skeleton"
      i18n-aria-label="@@home.loadingAria"
      aria-label="Ladowanie transakcji"
    >
      <div class="transaction-home-screen-skeleton__loader">
        <img
          src="images/loading-fort.png"
          alt="Budget Fort"
          class="transaction-home-screen-skeleton__icon"
          width="80"
          height="80"
        />
        <p class="transaction-home-screen-skeleton__text">Pobieranie danych z bazy...</p>
      </div>

      <div class="title shimmer"></div>
      <div class="cards">
        <div class="card shimmer"></div>
        <div class="card shimmer"></div>
        <div class="card shimmer"></div>
        <div class="card shimmer"></div>
      </div>
      <div class="list-item shimmer"></div>
      <div class="list-item shimmer"></div>
      <div class="list-item shimmer"></div>
    </section>
  `,
  styleUrl: './home-screen-skeleton.scss',
})
export class HomeScreenSkeletonComponent {}
