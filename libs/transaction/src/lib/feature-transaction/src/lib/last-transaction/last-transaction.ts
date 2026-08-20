import { Component } from '@angular/core';

@Component({
  selector: 'transaction-last-transaction',
  imports: [],
  template: `<p i18n="@@lastTransaction.placeholder">
    Ostatnia transakcja (w przygotowaniu).
  </p>`,
  styleUrl: './last-transaction.scss',
})
export class LastTransactionComponent {}
