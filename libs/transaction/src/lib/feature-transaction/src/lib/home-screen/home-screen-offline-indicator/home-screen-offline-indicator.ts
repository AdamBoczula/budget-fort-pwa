import { Component, input } from '@angular/core';

@Component({
  selector: 'transaction-home-screen-offline-indicator',
  template: `
    @if (error()) {
      <p class="info" i18n="@@home.offlineInfo">
        Tryb offline. Pokazywane sa tylko dane lokalne.
      </p>
    }
  `,
  styleUrl: './home-screen-offline-indicator.scss',
})
export class HomeScreenOfflineIndicatorComponent {
  public readonly error = input<string | null>(null);
}