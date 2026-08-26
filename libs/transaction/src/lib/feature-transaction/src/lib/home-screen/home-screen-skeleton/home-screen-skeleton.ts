import { Component } from '@angular/core';

@Component({
  selector: 'transaction-home-screen-skeleton',
  template: `
    <section
      i18n-aria-label="@@home.loadingAria"
      aria-label="Ladowanie transakcji"
    >
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