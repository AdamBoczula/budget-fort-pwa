import { Component, inject, input, LOCALE_ID, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

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
      <p class="transaction-header-toolbar__balance">
        {{ formatBalance(balance()) }}
      </p>
    </mat-toolbar>
  `,
  styleUrl: './transaction-header-toolbar.component.scss',
})
export class TransactionHeaderToolbarComponent {
  private readonly localeId = inject(LOCALE_ID);

  public readonly monthName = input('');
  public readonly balance = input(0);
  public readonly menuClick = output<void>();

  protected onMenuClick(): void {
    this.menuClick.emit();
  }

  protected formatBalance(balance: number): string {
    return new Intl.NumberFormat(this.localeId, {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(balance);
  }
}
