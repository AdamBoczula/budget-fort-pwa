import { Component } from '@angular/core';

@Component({
  selector: 'app-splash',
  template: `
    <div class="bf-splash-screen" role="status" aria-live="polite">
      <div class="bf-splash-screen__content">
        <img
          src="images/loading-fort.png"
          alt="Budget Fort"
          class="bf-splash-screen__logo"
          width="120"
          height="120"
        />
        <div class="bf-splash-screen__spinner"></div>
        <p class="bf-splash-screen__text" i18n="@@app.loadingData">Wczytywanie danych...</p>
      </div>
    </div>
  `,
  styleUrl: './splash.component.scss',
})
export class SplashComponent {}
