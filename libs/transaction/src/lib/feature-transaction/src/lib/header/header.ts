import { Component, input, output } from '@angular/core';
import { TransactionHeaderToolbarComponent } from '@ui-transaction';

@Component({
  selector: 'transaction-header',
  imports: [TransactionHeaderToolbarComponent],
  template: `
    <transaction-header-toolbar
      [monthName]="monthName()"
      [balance]="balance()"
      (menuClick)="requestMenuOpen()"
    />
  `,
  styleUrl: './header.scss',
})
export class TransactionTopBarComponent {
  public readonly monthName = input('');
  public readonly balance = input(0);
  public readonly menuClick = output<void>();

  protected requestMenuOpen(): void {
    this.menuClick.emit();
  }
}
