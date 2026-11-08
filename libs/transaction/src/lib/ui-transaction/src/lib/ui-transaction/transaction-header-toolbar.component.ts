// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CurrencyService } from '@currency';

@Component({
  selector: 'transaction-header-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="transaction-header-toolbar">
      <button
        type="button"
        matIconButton
        i18n-aria-label="@@toolbar.openNavigationAria"
        aria-label="Otworz nawigacje"
        (click)="onMenuClick()"
      >
        <mat-icon class="transaction-header-toolbar__menu-icon">menu</mat-icon>
      </button>

      <p class="transaction-header-toolbar__month">{{ monthName() }}</p>
      <p
        class="transaction-header-toolbar__balance"
        [class.transaction-header-toolbar__balance--positive]="balance() > 0"
        [class.transaction-header-toolbar__balance--negative]="balance() < 0"
        [class.transaction-header-toolbar__balance--zero]="balance() === 0"
      >
        <mat-icon class="transaction-header-toolbar__balance-icon">paid</mat-icon>
        {{ currencyService.format(balance()) }}
      </p>
    </mat-toolbar>
  `,
  styleUrl: './transaction-header-toolbar.component.scss',
})
export class TransactionHeaderToolbarComponent {
  protected readonly currencyService = inject(CurrencyService);

  public readonly monthName = input('');
  public readonly balance = input(0);
  public readonly menuClick = output<void>();

  protected onMenuClick(): void {
    this.menuClick.emit();
  }
}
